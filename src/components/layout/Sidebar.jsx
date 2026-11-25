import { NavLink } from "react-router-dom";
import { usePortalTheme } from "../../features/theme/hooks/usePortalTheme.js";
import { cn } from "../../utils/helpers.js";

export default function Sidebar({ items = [] }) {
    const theme = usePortalTheme();

    return (
        <aside
            className={cn(
                "z-10 shrink-0 border-b p-2 md:h-full md:w-56 md:overflow-y-auto md:border-b-0 md:border-r md:p-4",
                theme.sidebarBg,
                theme.statBorder,
            )}
        >
            <nav
                className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible"
                aria-label="Sidebar"
            >
                {items.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            cn(
                                "shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors md:block",
                                isActive
                                    ? theme.activeNav
                                    : cn("text-slate-600 dark:text-slate-300", theme.navHover),
                            )
                        }
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}