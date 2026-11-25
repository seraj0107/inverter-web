import { useState } from "react";
import { Activity, Gauge, Headphones, TrendingUp } from "lucide-react";
import bgImage from "../../../assets/images/inverter.jpg";
import { DEFAULT_VERSION_TYPE, VERSION_TYPES } from "../../../config/env.js";
import { cn } from "../../../utils/helpers.js";
import LoginForm from "../components/LoginForm.jsx";
import useAppVersion from "../hooks/useAppVersion.js";
import { getPortalTheme } from "../../theme/constants/portalTheme.js";

const STATS = [
    { icon: TrendingUp, value: "99.9%", label: "Uptime" },
    { icon: Gauge, value: "24/7", label: "Live Monitoring" },
    { icon: Activity, value: "5K+", label: "Installations" },
    { icon: Headphones, value: "24/7", label: "Support" },
];

export default function LoginPage() {
    const initialType = VERSION_TYPES.some(
        (item) => item.value === DEFAULT_VERSION_TYPE,
    )
        ? DEFAULT_VERSION_TYPE
        : VERSION_TYPES[0]?.value || DEFAULT_VERSION_TYPE;

    const [versionType, setVersionType] = useState(initialType);
    const theme = getPortalTheme(versionType);
    const {
        status,
        version,
        error: versionError,
        isReady: versionReady,
        retry,
    } = useAppVersion(versionType);

    return (
        <div className="flex min-h-dvh w-full flex-col lg:flex-row">
            <aside className="relative hidden overflow-hidden bg-black lg:flex lg:w-[45%] lg:flex-none lg:flex-col xl:w-1/2">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${bgImage})` }}
                />
                <div className="absolute inset-0 bg-black/50" />

                <div
                    className={cn(
                        "absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl transition-colors duration-500",
                        theme.glow,
                    )}
                />
                <div
                    className={cn(
                        "absolute -bottom-20 -left-20 h-72 w-72 rounded-full blur-3xl transition-colors duration-500",
                        theme.glow,
                    )}
                />

                <div className="relative z-10 flex w-full flex-1 flex-col justify-center p-8 xl:p-14">
                    <div className="max-w-lg">
                        <div className="mb-6 flex items-center gap-3">
                            <div
                                className={cn(
                                    "h-2 w-2 rounded-full transition-colors duration-500",
                                    theme.accentBg,
                                )}
                            />
                            <span
                                className={cn(
                                    "text-sm font-bold uppercase tracking-[0.2em] transition-colors duration-500",
                                    theme.accentText,
                                )}
                            >
                                {versionType} Portal
                            </span>
                        </div>

                        <h2 className="text-3xl font-extrabold leading-[1.15] text-white xl:text-5xl">
                            See exactly how your system is performing.
                        </h2>
                        <p className="mt-5 max-w-md text-sm leading-relaxed text-gray-200 xl:text-base">
                            Monitor solar production, battery storage and
                            inverter performance from anywhere with real-time
                            analytics.
                        </p>

                        <div className="mt-10 grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
                            {STATS.map(({ icon: Icon, value, label }) => (
                                <div
                                    key={label}
                                    className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-md transition hover:bg-black/60"
                                >
                                    <Icon
                                        size={18}
                                        strokeWidth={2.5}
                                        className={cn(
                                            "transition-colors duration-500",
                                            theme.accentText,
                                        )}
                                    />
                                    <p className="mt-3 text-xl font-bold text-white xl:text-2xl">
                                        {value}
                                    </p>
                                    <p className="text-[11px] font-medium text-gray-300 xl:text-xs">
                                        {label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="absolute bottom-8 left-8 text-xs font-medium text-gray-400 xl:bottom-12 xl:left-14">
                        © {new Date().getFullYear()} {versionType}. All rights
                        reserved.
                    </p>
                </div>
            </aside>

            <main
                className={cn(
                    "flex flex-1 flex-col transition-colors duration-500",
                    theme.pageBg,
                )}
            >
                <div className="flex items-center justify-center border-b border-gray-200 bg-black px-4 py-4 lg:hidden">
                    <div className="flex items-center gap-2">
                        <div
                            className={cn(
                                "h-2 w-2 rounded-full transition-colors duration-500",
                                theme.accentBg,
                            )}
                        />
                        <p className="text-sm font-bold uppercase tracking-widest text-white">
                            {versionType} Portal
                        </p>
                    </div>
                </div>

                <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-12">
                    <div className="mx-auto my-auto w-full max-w-md">
                        <div
                            className={cn(
                                "rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-xl shadow-black/5 sm:p-8",
                                theme.card,
                            )}
                        >
                            <div className="text-center">
                                <h1 className="text-2xl font-extrabold text-black dark:text-white sm:text-3xl">
                                    Welcome Back
                                </h1>
                                <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                                    Sign in to continue to your dashboard
                                </p>
                                <div
                                    className={cn(
                                        "mx-auto mt-4 h-1 w-12 rounded-full transition-colors duration-500",
                                        theme.accentBg,
                                    )}
                                />
                            </div>

                            <LoginForm
                                theme={theme}
                                versionType={versionType}
                                onChangeVersion={setVersionType}
                                version={version}
                                versionReady={versionReady}
                                versionStatus={status}
                                versionError={versionError}
                                onRetryVersion={retry}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
