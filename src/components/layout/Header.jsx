import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth.js";
import { usePortalTheme } from "../../features/theme/hooks/usePortalTheme.js";
import { routePaths } from "../../routes/routePaths.js";
import ThemeToggle from "../../features/theme/components/ThemeToggle.jsx";
import { LogOut } from "lucide-react";

export default function Header({ title }) {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const theme = usePortalTheme();

    const handleSignOut = () => {
        signOut();
        navigate(routePaths.login);
    };

    return (
        <header
            className={`z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6 ${theme.headerBg} ${theme.statBorder}`}
        >
            <div className="flex min-w-0 items-center gap-3">
                <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${theme.accentBg}`}
                />
                <div className="min-w-0">
                    <h1 className="text-base font-semibold text-gray-900 dark:text-slate-100 sm:text-lg">
                        {title}
                    </h1>
                    <p className="truncate text-xs text-gray-500 dark:text-slate-400">
                        {user?.station_name || "Inverter portal"}
                    </p>
                </div>
                {user?.version_type && (
                    <span
                        className={`hidden shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold sm:inline ${theme.badge}`}
                    >
                        {user.version_type}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2 ">
                <ThemeToggle className={theme.focusSelf } />
                <button
                    type="button"
                    onClick={handleSignOut}
                    title="Sign out"
                    aria-label="Sign out"
                    className={`shrink-0 cursor-pointer  rounded-lg p-2 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${theme.btn}`}
                >
                    <LogOut size={18} strokeWidth={2} />
                </button>
            </div>
        </header>
    );
}
