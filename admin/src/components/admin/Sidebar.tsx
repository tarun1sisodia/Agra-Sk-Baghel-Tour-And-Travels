import { NavLink, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Car,
  ChevronsLeft,
  ChevronsRight,
  Compass,
  ClipboardList,
  FileText,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquare,
  Route as RouteIcon,
  ScrollText,
  SlidersHorizontal,
  Star,
  Tag,
  TrendingUp,
  UploadCloud,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { BrandMark } from "./BrandMark";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS, type AdminUser } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/bookings", label: "Bookings", icon: CalendarDays },
  { to: "/vehicles", label: "Fleet & Vehicles", icon: Car },
  { to: "/fares/settings", label: "Fare Settings", icon: SlidersHorizontal },
  { to: "/fares/rates", label: "Round-Trip Rates", icon: TrendingUp },
  { to: "/routes", label: "Outstation Routes", icon: RouteIcon },
  { to: "/tour-packages", label: "Tour Packages", icon: MapPin },
  { to: "/local-transfers", label: "Local & Transfers", icon: Compass },
  { to: "/fares/extra-charges", label: "Extra Charges", icon: Tag },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/publishing", label: "Publishing Outbox", icon: UploadCloud },
  { to: "/promos", label: "Promo Codes", icon: Tag },
  { to: "/audit", label: "Audit Log", icon: ScrollText },
  { to: "/finance", label: "Finance & Refunds", icon: IndianRupee },
  { to: "/policies", label: "Policies & Company", icon: FileText },
  { to: "/inquiries", label: "Inquiries", icon: MessageSquare },
  { to: "/rental-requests", label: "Rental Requests", icon: ClipboardList },
];

const COLLAPSED_WIDTH = "w-[76px]";
const EXPANDED_WIDTH = "w-64";

function SidebarContent({
  user,
  onLogout,
  collapsed,
  onToggleCollapse,
  onNavigate,
  showCollapseToggle,
}: {
  user: AdminUser;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: () => void;
  showCollapseToggle: boolean;
}) {
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      {/* Brand + collapse toggle */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-3 px-5 pt-5",
          collapsed && "flex-col justify-center gap-2 px-2"
        )}
      >
        <BrandMark size={38} />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="font-display text-[17px] font-semibold leading-tight tracking-tight text-ink">
              Agra SK Baghel
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              Admin Desk
            </p>
          </div>
        )}
        {showCollapseToggle && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar to icons"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse to icons"}
            className="rounded-sm p-1.5 text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-gold"
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Nav — scrolls when the item list overflows the viewport */}
      <nav className="mt-6 min-h-0 flex-1 overflow-y-auto px-5 pb-2" aria-label="Admin">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item, i) => (
            <motion.li
              key={item.to}
              initial={reduce ? { opacity: 1 } : { opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + i * 0.045, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <NavLink
                to={item.to}
                end={item.to === "/"}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    "group relative flex min-h-[44px] items-center gap-3 rounded-sm py-2.5 text-sm font-medium transition-colors",
                    collapsed ? "justify-center px-0" : "px-3",
                    isActive
                      ? "text-gold-text"
                      : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active"
                        transition={{ type: "spring", stiffness: 480, damping: 36 }}
                        className="absolute inset-0 rounded-sm border border-gold-border bg-gold-soft"
                      />
                    )}
                    <item.icon
                      className={cn(
                        "relative z-10 h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                        isActive ? "text-gold" : "text-ink-faint group-hover:text-ink"
                      )}
                      aria-hidden="true"
                    />
                    {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
                    {item.badge ? (
                      collapsed ? (
                        <span
                          className="absolute right-1.5 top-1.5 z-10 h-2 w-2 rounded-full bg-gold"
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="relative z-10 ml-auto rounded-pill bg-gold px-1.5 py-px font-mono text-[10px] text-white">
                          {item.badge}
                        </span>
                      )
                    ) : null}
                  </>
                )}
              </NavLink>
            </motion.li>
          ))}
        </ul>
      </nav>

      {/* Role + user */}
      <div className={cn("shrink-0 space-y-3 px-5 pb-5 pt-2", collapsed && "flex flex-col items-center px-2")}>
        <div
          className={cn(
            "rounded-sm border border-hairline bg-surface-2 p-3",
            collapsed && "border-0 bg-transparent p-0"
          )}
          title={collapsed ? `${user.name} · ${ROLE_LABELS[user.role]}` : undefined}
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-ink font-display text-sm font-semibold text-gold">
              {user.name.slice(0, 1)}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-success" />
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink">{user.name}</p>
                <Badge tone="gold" className="mt-0.5">{ROLE_LABELS[user.role]}</Badge>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            onLogout();
            navigate("/login");
          }}
          title={collapsed ? "Sign out" : undefined}
          aria-label="Sign out"
          className={cn(
            "flex min-h-[44px] w-full items-center gap-2 rounded-sm px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-error-soft hover:text-error",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </div>
  );
}

export function Sidebar({
  user,
  onLogout,
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapse,
}: {
  user: AdminUser;
  onLogout: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <>
      {/* Desktop — collapsible to icon-only */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-hairline bg-bg-alt transition-[width] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none lg:block",
          collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH
        )}
        aria-label="Admin sidebar"
      >
        <SidebarContent
          user={user}
          onLogout={onLogout}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          onNavigate={() => {}}
          showCollapseToggle
        />
      </aside>

      {/* Mobile drawer — always expanded */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink/40"
            onClick={onMobileClose}
          />
          <motion.aside
            initial={reduce ? { opacity: 0 } : { x: -280 }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="absolute inset-y-0 left-0 w-72 border-r border-hairline bg-bg-alt"
          >
            <SidebarContent
              user={user}
              onLogout={onLogout}
              collapsed={false}
              onToggleCollapse={onToggleCollapse}
              onNavigate={onMobileClose}
              showCollapseToggle={false}
            />
          </motion.aside>
        </div>
      )}
    </>
  );
}
