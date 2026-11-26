import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePortalTheme } from "../../features/theme/hooks/usePortalTheme.js";
import { cn } from "../../utils/helpers.js";
import {
  toggleSidebarCollapsed,
  useSidebarCollapsed,
} from "./useSidebarCollapsed.js";

export default function Sidebar({ items = [] }) {
    const theme = usePortalTheme();
    const collapsed = useSidebarCollapsed();

    const Chevron = collapsed ? ChevronRight : ChevronLeft;
    const label = collapsed ? "Open sidebar" : "Close sidebar";

    return (
        /* Wrapper is NOT overflow-hidden, so the toggle can overlap the border.
           Desktop: width animates 14rem <-> 4rem. Mobile: the top strip folds up. */
        <div
            className={cn(
                "relative z-20 shrink-0 transition-[width] duration-300 ease-in-out md:h-full",
                collapsed ? "md:w-16" : "md:w-56",
            )}
        >
            <aside
                className={cn(
                    "border-b md:h-full md:overflow-y-auto md:overflow-x-hidden md:border-b-0 md:border-r md:p-4",
                    collapsed ? "p-0" : "p-2",
                    theme.sidebarBg,
                    theme.statBorder,
                )}
            >
                {/* grid-rows trick = smooth height collapse on mobile; md: always open */}
                <div
                    className={cn(
                        "grid transition-[grid-template-rows] duration-300 ease-in-out md:block",
                        collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
                    )}
                >
                    <nav
                        className={cn(
                            "flex min-h-0 gap-1 overflow-x-auto md:flex-col md:overflow-visible",
                            collapsed && "overflow-hidden md:overflow-visible",
                        )}
                        aria-label="Sidebar"
                    >
                        {items.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    title={collapsed ? item.label : undefined}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex shrink-0 items-center gap-3 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors md:relative",
                                            collapsed && "md:justify-center md:px-0",
                                            isActive
                                                ? theme.activeNav
                                                : cn(
                                                      "text-slate-600 dark:text-slate-300",
                                                      theme.navHover,
                                                  ),
                                        )
                                    }
                                >
                                    {/* keeps your icon if an item has one;
                                        otherwise the first letter shows when collapsed */}
                                    {Icon ? (
                                        <Icon size={18} className="shrink-0" />
                                    ) : (
                                        <span
                                            className={cn(
                                                "hidden w-5 shrink-0 text-center font-bold",
                                                collapsed && "md:inline",
                                            )}
                                            aria-hidden="true"
                                        >
                                            {String(item.label).charAt(0)}
                                        </span>
                                    )}
                                    <span
                                        className={cn(
                                            "transition-[opacity,transform] duration-300 ease-in-out",
                                            collapsed &&
                                                "md:absolute md:left-10 md:top-1/2 md:-translate-x-2 md:-translate-y-1/2 md:opacity-0",
                                        )}
                                        style={{ transitionDelay: `${index * 30}ms` }}
                                    >
                                        {item.label}
                                    </span>
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Toggle: desktop = top of the right edge (md:top-6, change to md:top-1/2 for the middle); mobile = right end of the bottom edge */}
            <button
                type="button"
                onClick={toggleSidebarCollapsed}
                aria-label={label}
                title={label}
                aria-expanded={!collapsed}
                className={cn(
                    "absolute z-30 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-[#700000] text-white shadow-md transition hover:bg-[#8a0000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-[#700000] dark:shadow-black/40 dark:hover:bg-[#8a0000] dark:ring-offset-[#120F0F]",
                    "right-3 top-full -translate-y-1/2",
                    "md:left-full md:right-auto md:top-6 md:-translate-x-1/2 md:translate-y-0",
                )}
            >
                {/* on mobile the chevron is turned to point up/down */}
                <Chevron
                    size={14}
                    strokeWidth={2.5}
                    className="rotate-90 transition-transform md:rotate-0"
                />
            </button>
        </div>
    );
}
