import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { nextStatus, ORDER_STATUSES } from "@/lib/utils";

/** List orders for the logged-in staff member's restaurant only */
export async function GET(request: Request) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const since = searchParams.get("since");

  const orders = await prisma.order.findMany({
    where: {
      restaurantId: session.user.restaurantId,
      ...(status && ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])
        ? { status }
        : {}),
      ...(since ? { updatedAt: { gt: new Date(since) } } : {}),
    },
    include: {
      items: true,
      table: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ orders, serverTime: new Date().toISOString() });
}

/** Update order status / customer fields / add or remove items */
export async function PATCH(request: Request) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      orderId,
      status,
      advance,
      customerName,
      customerPhone,
      customerEmail,
      specialRequest,
      addItem,
      removeItemId,
      updateItemQty,
    } = body as {
      orderId?: string;
      status?: string;
      advance?: boolean;
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      specialRequest?: string;
      addItem?: { menuItemId: string; quantity: number };
      removeItemId?: string;
      updateItemQty?: { orderItemId: string; quantity: number };
    };

    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId: session.user.restaurantId },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // --- Add a menu item to the order ---
    if (addItem) {
      const menuItem = await prisma.menuItem.findFirst({
        where: { id: addItem.menuItemId, restaurantId: session.user.restaurantId },
      });
      if (!menuItem) {
        return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
      }
      const qty = Math.max(1, Math.floor(addItem.quantity));
      const existing = order.items.find((i) => i.menuItemId === menuItem.id);
      let updatedOrder;

      if (existing) {
        const newQty = existing.quantity + qty;
        await prisma.orderItem.update({
          where: { id: existing.id },
          data: { quantity: newQty, subtotal: newQty * existing.unitPrice },
        });
      } else {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            menuItemId: menuItem.id,
            itemName: menuItem.name,
            quantity: qty,
            unitPrice: menuItem.price,
            subtotal: qty * menuItem.price,
          },
        });
      }

      // Recalculate total
      const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
      const total = items.reduce((sum, i) => sum + i.subtotal, 0);
      updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { total },
        include: { items: true, table: true },
      });
      return NextResponse.json({ order: updatedOrder });
    }

    // --- Remove an item from the order ---
    if (removeItemId) {
      const item = order.items.find((i) => i.id === removeItemId);
      if (!item) {
        return NextResponse.json({ error: "Order item not found" }, { status: 404 });
      }
      await prisma.orderItem.delete({ where: { id: removeItemId } });

      const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
      const total = items.reduce((sum, i) => sum + i.subtotal, 0);
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { total },
        include: { items: true, table: true },
      });
      return NextResponse.json({ order: updatedOrder });
    }

    // --- Update item quantity ---
    if (updateItemQty) {
      const item = order.items.find((i) => i.id === updateItemQty.orderItemId);
      if (!item) {
        return NextResponse.json({ error: "Order item not found" }, { status: 404 });
      }
      const newQty = Math.max(1, Math.floor(updateItemQty.quantity));
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { quantity: newQty, subtotal: newQty * item.unitPrice },
      });

      const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
      const total = items.reduce((sum, i) => sum + i.subtotal, 0);
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { total },
        include: { items: true, table: true },
      });
      return NextResponse.json({ order: updatedOrder });
    }

    // --- Status / customer field edits ---
    const data: Record<string, unknown> = {};

    let newStatus = status;
    if (advance && !status) {
      const next = nextStatus(order.status);
      if (!next) {
        return NextResponse.json({ error: "Order already completed" }, { status: 400 });
      }
      newStatus = next;
    }

    if (newStatus) {
      if (!ORDER_STATUSES.includes(newStatus as (typeof ORDER_STATUSES)[number])) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = newStatus;
    }

    if (customerName !== undefined) data.customerName = customerName;
    if (customerPhone !== undefined) data.customerPhone = customerPhone || null;
    if (customerEmail !== undefined) data.customerEmail = customerEmail || null;
    if (specialRequest !== undefined) data.specialRequest = specialRequest || null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data,
      include: { items: true, table: true },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      id,
      restaurantId: session.user.restaurantId,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  await prisma.order.delete({ where: { id: order.id } });
  return NextResponse.json({ ok: true });
}
