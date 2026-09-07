import Link from "next/link";
import {
  LayoutDashboard,
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
import { ThemeToggle } from "@/components/ThemeToggle";
import { TableRequestsPanel } from "@/components/TableRequestsPanel";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "orders", badgeKey: null },
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

export type NavKey = (typeof nav)[number]["key"] | "orders-link" | "kitchen";

function isNavActive(active: NavKey, key: (typeof nav)[number]["key"]) {
  if (active === "orders" || active === "orders-link" || active === "kitchen") {
    return key === "orders";
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
  void newOrderCount;
  void preparingCount;

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-sidebar)] lg:flex">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--gold)] text-[var(--gold)]">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg leading-tight text-[var(--gold-bright)]">
              {restaurantName}
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)]">Restaurant</p>
          </div>
        </div>

        <div className="border-b border-[var(--border)] p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/20 text-sm font-bold leading-none text-[var(--gold-bright)]">
              {userName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-5 text-[var(--text)]">{userName}</p>
              <p className="truncate text-xs leading-4 text-[var(--text-muted)]">{roleLabel}</p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 self-center text-[var(--text-dim)]" />
          </div>
          <div className="mb-2 flex items-center gap-2">
            <ThemeToggle className="shrink-0" />
            <TableRequestsPanel className="shrink-0" />
            <form
              className="min-w-0 flex-1"
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-muted)] transition hover:border-[var(--gold)]/40 hover:text-[var(--gold-bright)]"
              >
                Log out
              </button>
            </form>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {nav.map((item) => {
            const isActive = isNavActive(active, item.key);
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-gradient-to-r from-[var(--gold)]/25 to-transparent text-[var(--gold-bright)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 lg:hidden">
          <div className="min-w-0">
            <p className="font-display text-[var(--gold-bright)]">{restaurantName}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/20 text-[10px] font-bold leading-none text-[var(--gold-bright)]">
                {userName.slice(0, 1).toUpperCase()}
              </span>
              <p className="truncate text-[10px] leading-none text-[var(--text-dim)]">
                {userName} · {roleLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TableRequestsPanel />
            <ThemeToggle />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button type="submit" className="text-xs text-[var(--text-muted)]">
                Log out
              </button>
            </form>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-b border-[var(--border)] px-3 py-2 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs ${
                isNavActive(active, item.key)
                  ? "bg-[var(--gold)]/20 text-[var(--gold-bright)]"
                  : "text-[var(--text-muted)]"
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
