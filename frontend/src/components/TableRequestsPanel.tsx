"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, ClipboardList, Phone, Check } from "lucide-react";

type TableRequest = {
  id: string;
  type: string;
  message: string;
  status: string;
  tableNumber: number;
  createdAt: string;
};

export function TableRequestsPanel({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<TableRequest[]>([]);
  const [ackingId, setAckingId] = useState<string | null>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const [hasNew, setHasNew] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const pending = requests.filter((r) => r.status === "PENDING");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/table-requests?status=PENDING", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      const items: TableRequest[] = data.requests ?? [];
      setRequests(items);

      for (const item of items) {
        if (!knownIds.current.has(item.id)) {
          knownIds.current.add(item.id);
          setHasNew(true);
        }
      }
    } catch {
      // ignore transient errors
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }
  }, [open]);

  async function acknowledge(id: string) {
    setAckingId(id);
    try {
      const res = await fetch("/api/dashboard/table-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "ACKNOWLEDGED" }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
      }
    } finally {
      setAckingId(null);
    }
  }

  return (
    <div ref={panelRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setHasNew(false);
        }}
        aria-label="Table service notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--gold)] transition hover:border-[var(--gold)]/40 hover:bg-[var(--gold)]/10"
      >
        <Bell className="h-4 w-4" />
        {pending.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[9px] font-bold text-white">
            {pending.length > 9 ? "9+" : pending.length}
          </span>
        )}
        {hasNew && pending.length > 0 && (
          <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-[var(--danger)] ring-2 ring-[var(--bg-card)]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,320px)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow)]">
          <div className="border-b border-[var(--border)] px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Table requests
            </p>
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {pending.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-[var(--text-dim)]">
                No pending requests
              </li>
            ) : (
              pending.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start gap-2 border-b border-[var(--border)] px-3 py-3 last:border-0"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/15 text-[var(--gold)]">
                    {r.type === "WAITER" ? (
                      <Phone className="h-3.5 w-3.5" />
                    ) : (
                      <ClipboardList className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text)]">{r.message}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--text-dim)]">
                      {new Date(r.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={ackingId === r.id}
                    onClick={() => acknowledge(r.id)}
                    title="Acknowledge"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--border)] text-[var(--success)] transition hover:bg-[var(--success)]/10 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
