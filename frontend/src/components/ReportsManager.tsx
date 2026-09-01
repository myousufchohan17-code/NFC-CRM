"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { formatMoney, STATUS_LABELS, ORDER_STATUSES, type OrderStatus } from "@/lib/utils";

type ReportData = {
  from: string;
  to: string;
  summary: {
    totalOrders: number;
    completedOrders: number;
    revenue: number;
    averageOrderValue: number;
  };
  ordersByStatus: { status: string; label: string; count: number; revenue: number }[];
  daily: { date: string; orders: number; revenue: number }[];
  topItems: { name: string; quantity: number; revenue: number }[];
  categoryBreakdown: { name: string; quantity: number; revenue: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    tableNumber: number;
    status: string;
    total: number;
    createdAt: string;
    itemCount: number;
  }[];
};

const STATUS_COLOR: Record<string, string> = {
  NEW: "#ef4444",
  ACCEPTED: "#f97316",
  PREPARING: "#eab308",
  READY: "#22c55e",
  COMPLETED: "#3b82f6",
};

function toInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export function ReportsManager() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return toInput(d);
  });
  const [to, setTo] = useState(() => toInput(new Date()));
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/dashboard/reports?from=${from}&to=${to}`, { cache: "no-store" });
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const presets = [
    {
      label: "Today",
      set: () => {
        const d = new Date();
        setFrom(toInput(d));
        setTo(toInput(d));
      },
    },
    {
      label: "7 days",
      set: () => {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        setFrom(toInput(d));
        setTo(toInput(new Date()));
      },
    },
    {
      label: "30 days",
      set: () => {
        const d = new Date();
        d.setDate(d.getDate() - 29);
        setFrom(toInput(d));
        setTo(toInput(new Date()));
      },
    },
  ];

  const maxDailyRevenue = useMemo(
    () => Math.max(1, ...(data?.daily.map((d) => d.revenue) ?? [1])),
    [data]
  );

  const statusTotal = useMemo(
    () => (data?.ordersByStatus ?? []).reduce((s, x) => s + x.count, 0),
    [data]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Reports</h1>
          <p className="mt-1 text-sm text-[#a8a29e]">
            Sales, orders, and menu performance for the selected period.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={p.set}
                className="rounded-lg px-3 py-1.5 text-[#a8a29e] hover:bg-white/10 hover:text-white"
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={from}
            onChange={(e) => e.target.value && setFrom(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#d4a017]"
          />
          <span className="text-xs text-[#78716c]">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => e.target.value && setTo(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#d4a017]"
          />
        </div>
      </div>

      {loading && <p className="text-sm text-[#a8a29e]">Loading reports…</p>}

      {!loading && data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Revenue", value: formatMoney(data.summary.revenue), tone: "text-[#f0c14b]" },
              { label: "Orders", value: String(data.summary.totalOrders), tone: "text-white" },
              { label: "Completed", value: String(data.summary.completedOrders), tone: "text-[#22c55e]" },
              {
                label: "Avg order value",
                value: formatMoney(data.summary.averageOrderValue),
                tone: "text-[#3b82f6]",
              },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-[#a8a29e]">{k.label}</p>
                <p className={`mt-1 text-2xl font-semibold ${k.tone}`}>{k.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            {/* Daily revenue */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-medium text-white">Revenue by day</h2>
              <div className="mt-4 flex h-40 items-end gap-1">
                {data.daily.map((d) => (
                  <div key={d.date} className="group flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-[#d4a017]/30 to-[#f0c14b]"
                      style={{ height: `${Math.max(2, (d.revenue / maxDailyRevenue) * 100)}%` }}
                      title={`${d.date}: ${formatMoney(d.revenue)}`}
                    />
                    <span className="hidden text-[9px] text-[#555] sm:block">
                      {format(new Date(d.date + "T00:00:00"), "d")}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-right text-sm font-semibold text-[#f0c14b]">
                {formatMoney(data.summary.revenue)}
              </p>
            </section>

            {/* Status breakdown */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-medium text-white">Orders by status</h2>
              <ul className="mt-4 space-y-3">
                {ORDER_STATUSES.map((s) => {
                  const row = data.ordersByStatus.find((r) => r.status === s);
                  const count = row?.count ?? 0;
                  const pct = statusTotal ? (count / statusTotal) * 100 : 0;
                  return (
                    <li key={s}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-[#d6d3d1]">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: STATUS_COLOR[s] }}
                          />
                          {STATUS_LABELS[s as OrderStatus]}
                        </span>
                        <span className="text-[#a8a29e]">
                          {count} · {formatMoney(row?.revenue ?? 0)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: STATUS_COLOR[s] }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {/* Top items */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-medium text-white">Top selling items</h2>
              {data.topItems.length === 0 ? (
                <p className="mt-3 text-sm text-[#78716c]">No completed sales in this period.</p>
              ) : (
                <table className="mt-3 w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs text-[#a8a29e]">
                    <tr>
                      <th className="pb-2 font-medium">Item</th>
                      <th className="pb-2 font-medium">Sold</th>
                      <th className="pb-2 text-right font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topItems.map((t, i) => (
                      <tr key={t.name} className="border-b border-white/5">
                        <td className="py-2.5 text-white">
                          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#d4a017]/15 text-[10px] font-bold text-[#f0c14b]">
                            {i + 1}
                          </span>
                          {t.name}
                        </td>
                        <td className="py-2.5 text-[#a8a29e]">{t.quantity}</td>
                        <td className="py-2.5 text-right font-medium text-[#f0c14b]">
                          {formatMoney(t.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Category breakdown */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-medium text-white">Revenue by category</h2>
              {data.categoryBreakdown.length === 0 ? (
                <p className="mt-3 text-sm text-[#78716c]">No completed sales in this period.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {data.categoryBreakdown.map((c) => {
                    const pct =
                      data.summary.revenue > 0
                        ? (c.revenue / data.summary.revenue) * 100
                        : 0;
                    return (
                      <li key={c.name}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-[#d6d3d1]">{c.name}</span>
                          <span className="text-[#a8a29e]">
                            {c.quantity} sold · {formatMoney(c.revenue)}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#d4a017] to-[#f0c14b]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* Recent orders */}
          <section className="overflow-x-auto rounded-2xl border border-white/10">
            <h2 className="border-b border-white/10 bg-white/[0.03] px-5 py-3 font-medium text-white">
              Orders in period
            </h2>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs text-[#a8a29e]">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Table</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#78716c]">
                      No orders in this period.
                    </td>
                  </tr>
                )}
                {data.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-white/5">
                    <td className="px-4 py-3 font-medium text-white">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-[#d6d3d1]">{o.customerName}</td>
                    <td className="px-4 py-3 text-[#a8a29e]">{o.tableNumber}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: STATUS_COLOR[o.status] ?? "#666" }}
                        />
                        {STATUS_LABELS[o.status as OrderStatus] ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#a8a29e]">{o.itemCount}</td>
                    <td className="px-4 py-3 text-right font-medium text-[#f0c14b]">
                      {formatMoney(o.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
