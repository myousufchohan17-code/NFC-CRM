import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  ChefHat,
  Table2,
  UtensilsCrossed,
  Tags,
  Users,
  UserCog,
  BarChart3,
  Package,
  CreditCard,
  Settings,
  ChevronDown,
} from "lucide-react";
import { auth, signOut } from "@/lib/auth";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "orders", badgeKey: null },
  { href: "/dashboard", label: "Orders", icon: ShoppingBag, key: "orders-link", badgeKey: "orders" },
  { href: "/dashboard", label: "Kitchen", icon: ChefHat, key: "kitchen", badgeKey: "kitchen" },
  { href: "/dashboard/tables", label: "Tables", icon: Table2, key: "tables", badgeKey: null },
  { href: "/dashboard/menu", label: "Menu", icon: UtensilsCrossed, key: "menu", badgeKey: null },
  { href: "/dashboard/categories", label: "Categories", icon: Tags, key: "categories", badgeKey: null },
  { href: "/dashboard/customers", label: "Customers", icon: Users, key: "customers", badgeKey: null },
  { href: "/dashboard/staff", label: "Staff", icon: UserCog, key: "staff", badgeKey: null },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3, key: "reports", badgeKey: null },
  { href: "/dashboard/inventory", label: "Inventory", icon: Package, key: "inventory", badgeKey: null },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard, key: "payments", badgeKey: null },
  { href: "/dashboard/profile", label: "Settings", icon: Settings, key: "profile", badgeKey: null },
] as const;

export type NavKey = (typeof nav)[number]["key"];

function isNavActive(active: NavKey, key: (typeof nav)[number]["key"]) {
  if (active === "orders") {
    return key === "orders" || key === "orders-link" || key === "kitchen";
  }
  return key === active;
}

export async function DashboardShell({
  children,
  active,
  newOrderCount = 0,
  preparingCount = 0,
}: {
  children: React.ReactNode;
  active: NavKey;
  newOrderCount?: number;
  preparingCount?: number;
}) {
  const session = await auth();
  const userName = session?.user.name || "Admin";
  const roleLabel = session?.user.role === "ADMIN" ? "Administrator" : "Staff";
  const restaurantName = session?.user.restaurantName || "Bella Cucina";

  return (
    <div className="flex min-h-screen bg-black text-white">
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-[#1c1c1c] bg-[#0a0a0a] lg:flex">
        <div className="flex items-center gap-3 border-b border-[#1c1c1c] px-4 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d4a017] text-[#d4a017]">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-lg leading-tight text-[#e8c547]">{restaurantName}</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#777]">Restaurant</p>
          </div>
        </div>

        <div className="border-b border-[#1c1c1c] p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4a017]/20 text-sm font-bold text-[#e8c547]">
              {userName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-[#777]">{roleLabel}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-[#666]" />
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-lg border border-[#2a2a2a] px-3 py-2 text-xs text-[#aaa] hover:border-[#d4a017]/40 hover:text-[#e8c547]"
            >
              Log out
            </button>
          </form>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {nav.map((item) => {
            const isActive = isNavActive(active, item.key);
            const Icon = item.icon;
            const badge =
              item.badgeKey === "orders"
                ? newOrderCount
                : item.badgeKey === "kitchen"
                  ? preparingCount
                  : 0;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-gradient-to-r from-[#d4a017]/25 to-transparent text-[#e8c547]"
                    : "text-[#aaa] hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {badge > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-[#1c1c1c] px-4 py-3 lg:hidden">
          <div>
            <p className="font-display text-[#e8c547]">{restaurantName}</p>
            <p className="text-[10px] text-[#777]">{userName} · {roleLabel}</p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="text-xs text-[#aaa]">
              Log out
            </button>
          </form>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-b border-[#1c1c1c] px-3 py-2 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs ${
                isNavActive(active, item.key) ? "bg-[#d4a017]/20 text-[#e8c547]" : "text-[#aaa]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
