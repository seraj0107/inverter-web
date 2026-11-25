import { useEffect, useMemo, useRef, useState } from "react";
import {
    CalendarCheck,
    ChartNoAxesCombined,
    CircleCheck,
    CircleX,
    Clock,
    Cloud,
    Database,
    Gauge,
    Info,
    Leaf,
    Mail,
    MapPin,
    Microchip,
    Phone,
    Plug,
    Power,
    RefreshCw,
    ShieldCheck,
    Sun,
    Thermometer,
    TreePine,
    TriangleAlert,
    Wifi,
    Zap,
} from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { usePortalTheme } from "../../theme/hooks/usePortalTheme.js";
import { useDashboard } from "../hooks/useDashboard.js";
import {
    arr,
    axis,
    fmt,
    fmtDate,
    fmtTime,
    isOffline,
    nums,
    onTime,
    pct,
} from "../../../utils/formatDate.js";

const ICONS = {
    "fa-bolt": Zap,
    "fa-sun": Sun,
    "fa-solar-panel": Sun,
    "fa-calendar-check": CalendarCheck,
    "fa-clock": Clock,
    "fa-gauge-high": Gauge,
    "fa-temperature-half": Thermometer,
    "fa-plug-circle-check": Plug,
    "fa-power-off": Power,
    "fa-toggle-off": Power,
    "fa-toggle-on": Power,
    "fa-chart-line": ChartNoAxesCombined,
    "fa-chart-simple": ChartNoAxesCombined,
    "fa-arrow-trend-up": ChartNoAxesCombined,
    "fa-arrow-trend-down": ChartNoAxesCombined,
    "fa-house": MapPin,
    "fa-circle-check": CircleCheck,
    "fa-check": CircleCheck,
    "fa-circle-xmark": CircleX,
    "fa-xmark": CircleX,
    "fa-triangle-exclamation": TriangleAlert,
    "fa-bell": TriangleAlert,
    "fa-microchip": Microchip,
    "fa-wifi": Wifi,
    "fa-signal": Wifi,
    "fa-cloud": Cloud,
    "fa-leaf": Leaf,
    "fa-coins": Leaf,
    "fa-tree": TreePine,
    "fa-trowel-bricks": ShieldCheck,
    "fa-shield-halved": ShieldCheck,
    "fa-database": Database,
    "fa-terminal": Info,
    "fa-circle-info": Info,
    "fa-bars-progress": Database,
    "fa-rotate": RefreshCw,
    "fa-mobile-screen-button": Phone,
    "fa-phone": Phone,
    "fa-envelope": Mail,
};

const ALARM_LIMITS = [5, 10, 20, 50];

function Icon({ name, className = "h-4 w-4", ...props }) {
    const Component = ICONS[name] || Info;
    return <Component className={className} {...props} />;
}

function useTween(target, duration = 900) {
    const [value, setValue] = useState(0);
    const current = useRef(0);

    useEffect(() => {
        const from = current.current;
        const to = axis(target);
        if (from === to) return undefined;

        let frame;
        const started = performance.now();
        const tick = (now) => {
            const progress = Math.min((now - started) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const next = from + (to - from) * eased;
            current.current = next;
            setValue(next);
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [target, duration]);

    return value;
}

function PulseDot({ active, color }) {
    return (
        <span className="relative flex h-2 w-2">
            {active && (
                <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                    style={{ backgroundColor: color }}
                />
            )}
            <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
            />
        </span>
    );
}

function Card({ theme, className = "", children }) {
    return (
        <div
            className={`rounded-2xl border shadow-sm ${theme.card} ${theme.statBorder} ${className}`}
        >
            {children}
        </div>
    );
}

function Title({ theme, icon, children, action }) {
    return (
        <div
            className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5 sm:py-4 ${theme.statBorder}`}
        >
            <div className="flex items-center gap-2">
                <Icon name={icon} className={`h-4 w-4 ${theme.icon}`} />
                <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                    {children}
                </h2>
            </div>
            {action && (
                <div className="flex flex-wrap items-center gap-2">
                    {action}
                </div>
            )}
        </div>
    );
}

function Panel({ theme, title, icon, action, className = "", children }) {
    return (
        <Card theme={theme} className={className}>
            <Title theme={theme} icon={icon} action={action}>
                {title}
            </Title>
            <div className="p-4 sm:p-5">{children}</div>
        </Card>
    );
}

function Kpi({ theme, icon, label, value, sub, accent }) {
    return (
        <article
            className={`relative overflow-hidden rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${theme.statBg} ${theme.statBorder}`}
        >
            <span
                className={`absolute inset-x-0 top-0 h-0.5 ${theme.accentBg}`}
            />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                        {label}
                    </p>
                    <p
                        className={`mt-2 truncate text-xl font-bold sm:text-2xl ${theme.textOnLight}`}
                    >
                        {value}
                    </p>
                </div>
                <span className={`rounded-lg p-2 ${theme.glow}`}>
                    <Icon
                        name={icon}
                        className="h-4 w-4"
                        style={accent ? { color: accent } : undefined}
                    />
                </span>
            </div>
            {sub && (
                <div className="mt-2 text-[11px] text-gray-500 dark:text-slate-400">
                    {sub}
                </div>
            )}
        </article>
    );
}

function PRow({ theme, icon, label, value, sub }) {
    return (
        <div
            className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${theme.statBg}`}
        >
            <div className="flex min-w-0 items-center gap-2">
                <Icon
                    name={icon}
                    className={`h-4 w-4 shrink-0 ${theme.icon}`}
                />
                <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-gray-800 dark:text-slate-100">
                        {label}
                    </p>
                    {sub && (
                        <p className="truncate text-[10px] text-gray-500 dark:text-slate-400">
                            {sub}
                        </p>
                    )}
                </div>
            </div>
            <p
                className={`min-w-0 truncate text-right text-sm font-bold ${theme.textOnLight}`}
            >
                {value}
            </p>
        </div>
    );
}

/* Plain detail line: no box, no border — icon + label + value */
function InfoLine({ theme, icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <Icon
                name={icon}
                className={`mt-1 h-4 w-4 shrink-0 ${theme.icon}`}
            />
            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    {label}
                </p>
                <p
                    className={`break-all text-sm font-bold ${theme.textOnLight}`}
                >
                    {value}
                </p>
            </div>
        </div>
    );
}

function Tab({ theme, active, children, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`whitespace-nowrap rounded-full cursor-pointer px-3 py-1 text-[11px] font-bold transition ${
                active
                    ? `${theme.tabActive} border border-transparent`
                    : `border ${theme.statBorder} text-gray-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700`
            }`}
        >
            {children}
        </button>
    );
}

function Delta({ value, label }) {
    if (value === null)
        return (
            <span className="text-gray-400 dark:text-slate-500">
                No comparison
            </span>
        );
    const positive = value >= 0;
    return (
        <span style={{ color: positive ? "#16A34A" : "#DC2626" }}>
            {positive ? "+" : ""}
            {fmt(value, 1)}% {label}
        </span>
    );
}

function Comm({ theme, rows }) {
    return (
        <div className="space-y-2">
            {rows.map(({ label, ok, sub }) => (
                <div
                    key={label}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${theme.statBorder} ${theme.statBg}`}
                >
                    <div>
                        <p className="text-xs font-semibold text-gray-800 dark:text-slate-100">
                            {label}
                        </p>
                        {sub && (
                            <p className="text-[10px] text-gray-500 dark:text-slate-400">
                                {sub}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className={`text-[10px] font-bold ${ok ? "text-emerald-600" : "text-red-600"}`}
                        >
                            {ok ? "Connected" : "Not connected"}
                        </span>
                        <Icon
                            name={ok ? "fa-circle-check" : "fa-circle-xmark"}
                            className={`h-4 w-4 ${ok ? "text-emerald-600" : "text-red-600"}`}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

function Health({ theme, value, color, status, dataStatus, lastDataReceived }) {
    const radius = 46;
    const circumference = 2 * Math.PI * radius;
    const dash = (Math.min(Math.max(value, 0), 100) / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div className="relative h-32 w-32 shrink-0">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        className="stroke-gray-200 dark:stroke-slate-700"
                        strokeWidth="10"
                    />
                    <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${dash} ${circumference}`}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                        {fmt(value, 0)}%
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                        Healthy
                    </span>
                </div>
            </div>
            <div
                className={`flex-1 rounded-xl border p-4 ${theme.statBorder} ${theme.statBg}`}
            >
                <p className="text-xs font-bold text-gray-800 dark:text-slate-100">
                    System status
                </p>
                <p className="mt-1 text-sm" style={{ color }}>
                    {status}
                </p>
                <div className="mt-3 space-y-1 text-[11px] text-gray-500 dark:text-slate-400">
                    <p>
                        Data state:{" "}
                        <span className="font-semibold text-gray-700 dark:text-slate-200">
                            {dataStatus || "unknown"}
                        </span>
                    </p>
                    <p>
                        Last received:{" "}
                        <span className="font-semibold text-gray-700 dark:text-slate-200">
                            {fmtDate(lastDataReceived)}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

function TrendChart({ theme, series, unit = "kW" }) {
    const [hover, setHover] = useState(null);
    const points = useMemo(() => {
        const values = series.map((item) => axis(item?.value));
        const max = Math.max(...values, 0.1);
        const min = Math.min(...values, 0);
        const width = 700;
        const height = 220;
        const left = 44;
        const right = 16;
        const top = 18;
        const bottom = 34;

        return {
            values,
            max,
            min,
            width,
            height,
            left,
            right,
            top,
            bottom,
            coords: values.map((value, index) => ({
                x:
                    left +
                    (index * (width - left - right)) /
                        Math.max(values.length - 1, 1),
                y:
                    height -
                    bottom -
                    ((value - min) / (max - min || 1)) *
                        (height - top - bottom),
            })),
        };
    }, [series]);

    const hasData = series.some((item) => axis(item?.value) > 0);

    if (!series.length || !hasData) {
        return (
            <div className="flex h-48 flex-col items-center justify-center gap-1 text-center sm:h-56">
                <Icon
                    name="fa-chart-line"
                    className="h-8 w-8 text-gray-300 dark:text-slate-600"
                />
                <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    No power output recorded
                </p>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Try the 7 Days or 30 Days tab.
                </p>
            </div>
        );
    }

    const line = points.coords
        .map(
            (point, index) =>
                `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
        )
        .join(" ");
    const area = `${line} L ${points.coords[points.coords.length - 1].x} ${points.height - points.bottom} L ${points.coords[0].x} ${points.height - points.bottom} Z`;
    const labelEvery = Math.max(1, Math.ceil(series.length / 6));
    const hovered = hover === null ? null : series[hover];

    return (
        <div className="relative">
            <svg
                viewBox={`0 0 ${points.width} ${points.height}`}
                className="h-48 w-full overflow-visible sm:h-56"
            >
                {[0, 0.5, 1].map((ratio) => {
                    const y =
                        points.top +
                        ratio * (points.height - points.top - points.bottom);
                    const value =
                        points.max - ratio * (points.max - points.min);
                    return (
                        <g key={ratio}>
                            <line
                                x1={points.left}
                                x2={points.width - points.right}
                                y1={y}
                                y2={y}
                                className="stroke-gray-200 dark:stroke-slate-700"
                                strokeWidth="1"
                            />
                            <text
                                x={points.left - 8}
                                y={y + 4}
                                textAnchor="end"
                                fontSize="12"
                                className="fill-gray-400 dark:fill-slate-500"
                            >
                                {fmt(value, 1)}
                            </text>
                        </g>
                    );
                })}
                <path d={area} fill={theme.chart} opacity="0.1" />
                <path
                    d={line}
                    fill="none"
                    stroke={theme.chart}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {points.coords.map((point, index) => (
                    <g key={`${series[index]?.label}-${index}`}>
                        <circle
                            cx={point.x}
                            cy={point.y}
                            r={hover === index ? 5 : 3}
                            className="fill-white dark:fill-slate-900"
                            stroke={theme.chart}
                            strokeWidth="2"
                            onMouseEnter={() => setHover(index)}
                            onMouseLeave={() => setHover(null)}
                        />
                        {index % labelEvery === 0 && (
                            <text
                                x={point.x}
                                y={points.height - 10}
                                textAnchor="middle"
                                fontSize="12"
                                className="fill-gray-400 dark:fill-slate-500"
                            >
                                {series[index]?.label}
                            </text>
                        )}
                    </g>
                ))}
            </svg>
            {hovered && (
                <div
                    className={`pointer-events-none absolute right-2 top-2 rounded-lg border px-3 py-2 text-[11px] shadow-sm ${theme.card} ${theme.statBorder}`}
                >
                    <p className="font-bold text-gray-800 dark:text-slate-100">
                        {hovered.label}
                    </p>
                    <p style={{ color: theme.chart }}>
                        {fmt(hovered.value, 2)} {unit}
                    </p>
                    {unit === "kW" && hovered.kwh !== undefined && (
                        <p className="text-gray-500 dark:text-slate-400">
                            {fmt(hovered.kwh, 2)} kWh
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

function BarChart({ theme, bars }) {
    const [hover, setHover] = useState(null);

    if (!bars.length || bars.every((item) => axis(item.kwh) === 0)) {
        return (
            <div className="flex h-40 flex-col items-center justify-center gap-1 text-center">
                <Icon
                    name="fa-chart-simple"
                    className="h-8 w-8 text-gray-300 dark:text-slate-600"
                />
                <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    No generation recorded
                </p>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Try the 7 Days or 30 Days tab.
                </p>
            </div>
        );
    }

    const max = Math.max(...bars.map((item) => axis(item.kwh)), 0.01);
    // Many bars (30 days): fit the card, hide per-bar numbers, thin out labels
    const dense = bars.length > 12;
    const step = Math.max(1, Math.ceil(bars.length / 7));

    return (
        <div className="w-full min-w-0">
            <div
                className={`flex h-40 items-end ${dense ? "gap-0.5" : "gap-2"}`}
            >
                {bars.map((bar, index) => {
                    const value = axis(bar.kwh);
                    const height =
                        value > 0 ? Math.max((value / max) * 100, 2) : 0;
                    return (
                        <div
                            key={`${bar.label}-${index}`}
                            title={`${bar.label}: ${fmt(bar.kwh, 2)} kWh`}
                            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                            onMouseEnter={() => setHover(index)}
                            onMouseLeave={() => setHover(null)}
                        >
                            {!dense && (
                                <span className="text-[9px] font-semibold text-gray-500 dark:text-slate-400">
                                    {fmt(bar.kwh, 2)}
                                </span>
                            )}
                            <div
                                className={`w-full rounded-t-md transition ${hover === index ? "opacity-100" : "opacity-80"}`}
                                style={{
                                    height: `${height}%`,
                                    backgroundColor: theme.chart,
                                }}
                            />
                        </div>
                    );
                })}
            </div>
            <div className={`mt-2 flex h-4 ${dense ? "gap-0.5" : "gap-2"}`}>
                {bars.map((bar, index) => (
                    <span
                        key={`${bar.label}-label-${index}`}
                        className="relative min-w-0 flex-1"
                    >
                        {index % step === 0 && (
                            <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-gray-500 dark:text-slate-400">
                                {bar.label}
                            </span>
                        )}
                    </span>
                ))}
            </div>
            {dense && (
                <p className="mt-2 h-4 text-center text-[10px] font-semibold text-gray-600 dark:text-slate-300">
                    {hover !== null
                        ? `${bars[hover].label} · ${fmt(bars[hover].kwh, 2)} kWh`
                        : "Hover a bar to see its value"}
                </p>
            )}
        </div>
    );
}

/* ---------- Energy flow (Solar → Inverter → Grid + Home) ---------- */
const FLOW_ICONS = {
    solar: (
        <>
            <path d="M4 8h16l2 10H2z" />
            <path d="M8.5 8L7 18M12 8v10M15.5 8L17 18M3 13h18" />
        </>
    ),
    inverter: (
        <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M6 12c1.5-3.5 3-3.5 4.5 0s3 3.5 4.5 0" />
            <path d="M8 21v-2M16 21v-2" />
        </>
    ),
    grid: <path d="M12 3l-5 18M12 3l5 18M8.5 9h7M7.5 14h9M4 7h16" />,
    home: <path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6" />,
};

function FlowLine({ theme, d, active, dots = 3, dur = 3 }) {
    return (
        <g>
            <path
                d={d}
                fill="none"
                stroke={active ? theme.chart : "#D1D5DB"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={active ? undefined : "4 7"}
                opacity={active ? 0.35 : 1}
            />
            {active &&
                Array.from({ length: dots }, (_, i) => (
                    <circle key={i} r="4.5" fill={theme.chart}>
                        <animateMotion
                            dur={`${dur}s`}
                            begin={`${(-(i * dur) / dots).toFixed(2)}s`}
                            repeatCount="indefinite"
                            path={d}
                        />
                    </circle>
                ))}
        </g>
    );
}

function FlowNode({ theme, x, y, r = 36, icon, label, value, active, pulse }) {
    const color = active ? theme.chart : "#9CA3AF";
    const size = r * 0.95;
    return (
        <g transform={`translate(${x},${y})`}>
            {pulse && active && (
                <circle r={r} fill={theme.chart} opacity="0.2">
                    <animate
                        attributeName="r"
                        values={`${r};${r + 16}`}
                        dur="2.2s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="opacity"
                        values="0.25;0"
                        dur="2.2s"
                        repeatCount="indefinite"
                    />
                </circle>
            )}
            <circle
                r={r}
                className="fill-white dark:fill-slate-900"
                stroke={color}
                strokeWidth="2.5"
            />
            <svg
                x={-size / 2}
                y={-size / 2}
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {FLOW_ICONS[icon]}
            </svg>
            <text
                y={r + 26}
                textAnchor="middle"
                fontSize="20"
                fontWeight="700"
                className="fill-gray-800 dark:fill-slate-100"
            >
                {label}
            </text>
            <text
                y={r + 48}
                textAnchor="middle"
                fontSize="20"
                fontWeight="700"
                fill={color}
            >
                {value}
            </text>
        </g>
    );
}

function EnergyFlow({
    theme,
    flowing,
    solarKw,
    inverterKw,
    gridConnected,
    homeKw,
}) {
    return (
        <div className="overflow-x-auto">
            <svg
                viewBox="0 0 800 266"
                className="h-auto w-full min-w-[400px]"
                role="img"
                aria-label="Energy flow from solar to inverter, grid and home"
            >
                <FlowLine
                    theme={theme}
                    active={flowing}
                    d="M128 110 L322 110"
                    dots={3}
                    dur={3}
                />
                <FlowLine
                    theme={theme}
                    active={flowing}
                    d="M398 110 C500 110 520 52 622 52"
                    dots={3}
                    dur={3.4}
                />
                <FlowLine
                    theme={theme}
                    active={flowing}
                    d="M398 110 C500 110 520 170 622 170"
                    dots={2}
                    dur={3.4}
                />

                <FlowNode
                    theme={theme}
                    x={90}
                    y={110}
                    r={38}
                    icon="solar"
                    label="Solar PV"
                    value={`${fmt(solarKw, 2)} kW`}
                    active={flowing}
                />
                <FlowNode
                    theme={theme}
                    x={360}
                    y={110}
                    r={38}
                    icon="inverter"
                    label="Inverter"
                    value={flowing ? `${fmt(inverterKw, 2)} kW` : "OFFLINE"}
                    active={flowing}
                    pulse
                />
                <FlowNode
                    theme={theme}
                    x={660}
                    y={52}
                    r={34}
                    icon="grid"
                    label="Grid"
                    value={
                        gridConnected
                            ? `${fmt(inverterKw, 2)} kW`
                            : "Disconnected"
                    }
                    active={flowing}
                />
                <FlowNode
                    theme={theme}
                    x={660}
                    y={170}
                    r={34}
                    icon="home"
                    label="Home load"
                    value={homeKw == null ? "--" : `${fmt(homeKw, 2)} kW`}
                    active={flowing}
                />
            </svg>
        </div>
    );
}

function alarmIcon(alarm) {
    const message = String(alarm?.message || "").toLowerCase();
    if (message.includes("grid") || message.includes("ac"))
        return "fa-plug-circle-check";
    if (message.includes("temp")) return "fa-temperature-half";
    if (alarm?.status === "Recovered" || message.includes("clear"))
        return "fa-circle-check";
    return "fa-triangle-exclamation";
}

const COMPLIANCE_LABELS = {
    fiveMinReporting: "5-minute reporting",
    eventTransmission: "Event transmission",
    inverterMapping: "Inverter mapping",
    apiConnected: "API connected",
    dataStorageIndia: "Data stored in India",
    secureCommunication: "Secure communication",
};

export default function DashboardPage() {
    const { user } = useAuth();
    const theme = usePortalTheme();
    const { data, loading, error, refresh } = useDashboard();
    const [range, setRange] = useState("Today");
    const [alarmTab, setAlarmTab] = useState("recent");
    const [alarmLimit, setAlarmLimit] = useState(10);

    const plant = data?.plant ?? {};
    const inv = data?.inverter ?? {};
    const dc = data?.live?.dc ?? {};
    const ac = data?.live?.ac ?? {};
    const en = data?.energy ?? {};
    const comm = data?.communication ?? {};
    const hist = useMemo(() => data?.history ?? {}, [data]);
    const comp = data?.compliance ?? {};
    const info = data?.userInformation ?? {};
    const activeAlarms = arr(data?.alarms?.active);
    const recentAlarms = arr(data?.alarms?.recent);
    const week = arr(hist.last7Days);

    const livePower = axis(ac.activePowerKw);
    const animatedPower = useTween(livePower);
    const isOnline = String(inv.status || "").toUpperCase() === "RUNNING";
    const isPlantOffline = isOffline(plant);
    // Dots move only while the plant is NOT offline
    const flowing = !isPlantOffline;
    const dataIsLive = String(data?.dataStatus || "").toLowerCase() === "live";
    const statusText = isPlantOffline
        ? "No plant communication"
        : isOnline
          ? "Generating power"
          : "Inverter offline";
    const hasWarning = isPlantOffline || !isOnline || activeAlarms.length > 0;

    const todayDelta = pct(en.todayKwh, en.yesterdayKwh);
    const weekDelta = pct(en.last7DaysKwh, en.previous7DaysKwh);
    const weekTotal = nums(week.map((item) => item?.kwh)).reduce(
        (sum, value) => sum + value,
        0,
    );
    const weekAverage = week.length ? weekTotal / week.length : 0;

    const complianceValues = Object.values(comp);
    const healthyCount = complianceValues.filter(
        (value) => value === true,
    ).length;
    const healthPct = complianceValues.length
        ? (healthyCount / complianceValues.length) * 100
        : 0;
    const healthColor =
        data?.dataStatus === "stale"
            ? "#F59E0B"
            : healthPct >= 80
              ? "#16A34A"
              : healthPct >= 50
                ? "#F59E0B"
                : "#DC2626";

    const bars = useMemo(() => {
        if (range === "Today") {
            const today = arr(hist.today);
            if (today.length) {
                return today.map((item) => ({
                    label: item?.label ?? fmtTime(item?.time),
                    kwh: axis(item?.kwh),
                }));
            }
            return [{ label: "Today", kwh: axis(en.todayKwh) }];
        }
        const source =
            range === "7 Days" ? arr(hist.last7Days) : arr(hist.last30Days);
        return source.map((item) => ({
            label: item?.label ?? item?.day ?? "--",
            kwh: axis(item?.kwh),
        }));
    }, [range, hist, en.todayKwh]);

    const trendUnit = range === "Today" ? "kW" : "kWh";
    const trend = useMemo(() => {
        const isToday = range === "Today";
        const source = isToday
            ? arr(hist.today)
            : range === "7 Days"
              ? arr(hist.last7Days)
              : arr(hist.last30Days);
        return source.map((item) => ({
            label: item?.label ?? item?.day ?? fmtTime(item?.time),
            // Today = power curve (kW), 7/30 days = daily energy (kWh)
            value: isToday ? axis(item?.powerKw) : axis(item?.kwh),
            kwh: axis(item?.kwh),
        }));
    }, [range, hist]);

    const currentAlarms = alarmTab === "active" ? activeAlarms : recentAlarms;
    const renderedAlarms = currentAlarms.slice(0, alarmLimit);

    if (loading && !data) {
        return (
            <p
                className={`p-6 text-sm text-gray-500 dark:text-slate-400 ${theme.pageBg}`}
            >
                Loading your solar data…
            </p>
        );
    }

    if (error && !data) {
        return (
            <div className={`p-6 ${theme.pageBg}`}>
                <p className="text-sm text-red-600">{error}</p>
                <button
                    type="button"
                    onClick={refresh}
                    className={`mt-3 rounded-full px-4 py-2 text-xs font-bold ${theme.btn}`}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <section
            className={`space-y-4 p-4 sm:p-5 lg:p-6 xl:p-8 ${theme.pageBg}`}
        >
            {error && (
                <p
                    className={`rounded-lg border px-3 py-2 text-xs ${theme.statBorder} ${theme.statBg} ${theme.textOnLight}`}
                >
                    Could not refresh. Showing the last values received.
                </p>
            )}

            <Card theme={theme} className="relative overflow-hidden p-4 sm:p-6">
                <span
                    className={`absolute inset-x-0 top-0 h-1 ${theme.accentBg}`}
                />
                <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-center">
                    {/* LEFT: title + plain details (no boxes) */}
                    <div className="min-w-0">
                        <p
                            className={`text-[11px] font-bold uppercase tracking-[0.2em] ${theme.textOnLight}`}
                        >
                            {user?.version_type ||
                                info.version_type ||
                                "Portal"}{" "}
                            dashboard
                        </p>
                        <h1 className="mt-2 text-xl font-bold text-gray-900 dark:text-slate-100 sm:text-2xl">
                            {plant.name ||
                                user?.station_name ||
                                info.station_name ||
                                "Welcome"}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            {plant.systemTitle ||
                                user?.station_type ||
                                "Solar monitoring overview"}
                        </p>
                        {/* <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                            {plant.consumerId && (
                                <span
                                    className={`rounded-full border px-2 py-1 ${theme.badge}`}
                                >
                                    {plant.consumerId}
                                </span>
                            )}
                            {plant.plantId && (
                                <span
                                    className={`rounded-full border px-2 py-1 ${theme.badge}`}
                                >
                                    Plant {plant.plantId}
                                </span>
                            )}
                        </div> */}

                        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
                            <InfoLine
                                theme={theme}
                                icon="fa-bolt"
                                label="Capacity"
                                value={`${fmt(plant.capacityKwp, 2)} kWp`}
                            />
                            <InfoLine
                                theme={theme}
                                icon="fa-microchip"
                                label="Model Number"
                                value={
                                    plant.modelNumber ||
                                    user?.model_number ||
                                    "--"
                                }
                            />
                            <InfoLine
                                theme={theme}
                                icon="fa-bars-progress"
                                label="Inverter Serial"
                                value={
                                    inv.serialNo ||
                                    inv.registeredSerialNo ||
                                    "--"
                                }
                            />
                            <InfoLine
                                theme={theme}
                                icon="fa-signal"
                                label="Collector Address"
                                value={
                                    inv.collectorAddress ||
                                    user?.collector_address ||
                                    "--"
                                }
                            />
                        </div>
                    </div>

                    {/* RIGHT: status badges + compact energy flow */}
                    <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2 lg:justify-end">
                            <span
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold ${theme.badge}`}
                            >
                                <PulseDot
                                    active={isOnline && dataIsLive}
                                    color={isOnline ? "#16A34A" : "#DC2626"}
                                />
                                {isOnline && dataIsLive ? "LIVE" : "LAST SEEN"}
                            </span>
                            <span
                                className="rounded-full px-3 py-1 text-[11px] font-bold"
                                style={{
                                    color: hasWarning ? "#B45309" : "#16A34A",
                                    backgroundColor: hasWarning
                                        ? "#FEF3C7"
                                        : "#DCFCE7",
                                }}
                            >
                                {statusText}
                            </span>
                        </div>
                        <EnergyFlow
                            theme={theme}
                            flowing={flowing}
                            solarKw={axis(dc.powerW) / 1000}
                            inverterKw={axis(ac.activePowerKw)}
                            gridConnected={Boolean(inv.gridConnected)}
                            homeKw={null}
                        />
                    </div>
                </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Kpi
                    theme={theme}
                    icon="fa-bolt"
                    label="Current AC power"
                    value={`${fmt(animatedPower, 2)} kW`}
                    sub={`${fmt(ac.activePowerKw, 2)} kW · ${inv.gridConnected ? "Grid connected" : "Grid disconnected"}`}
                    accent={theme.chart}
                />
                <Kpi
                    theme={theme}
                    icon="fa-sun"
                    label="Today generation"
                    value={`${fmt(en.todayKwh, 2)} kWh`}
                    sub={<Delta value={todayDelta} label="vs yesterday" />}
                    accent={theme.chart}
                />
                <Kpi
                    theme={theme}
                    icon="fa-calendar-check"
                    label="This month"
                    value={`${fmt(en.monthKwh, 2)} kWh`}
                    sub={`Year ${fmt(en.yearKwh, 2)} kWh`}
                    accent={theme.chart}
                />
                <Kpi
                    theme={theme}
                    icon="fa-chart-line"
                    label="Lifetime generation"
                    value={`${fmt(en.lifetimeKwh, 1)} kWh`}
                    sub={`CO₂ saved ${fmt(en.co2SavedKg, 1)} kg`}
                    accent={theme.chart}
                />
            </div>

            <Panel
                theme={theme}
                title="Real-time electrical parameters"
                icon="fa-plug-circle-check"
            >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <PRow
                        theme={theme}
                        icon="fa-bolt"
                        label="DC voltage"
                        value={`${fmt(dc.voltageV, 1)} V`}
                    />
                    <PRow
                        theme={theme}
                        icon="fa-bolt"
                        label="DC current"
                        value={`${fmt(dc.currentA, 2)} A`}
                    />
                    <PRow
                        theme={theme}
                        icon="fa-bolt"
                        label="DC power"
                        value={`${fmt(dc.powerW, 0)} W`}
                        sub={`${arr(dc.mppt).length} MPPT channels`}
                    />
                    <PRow
                        theme={theme}
                        icon="fa-plug-circle-check"
                        label="AC phase voltage"
                        value={`${fmt(ac.phaseVoltageV, 1)} V`}
                    />
                    <PRow
                        theme={theme}
                        icon="fa-plug-circle-check"
                        label="AC phase current"
                        value={`${fmt(ac.phaseCurrentA, 2)} A`}
                    />
                    <PRow
                        theme={theme}
                        icon="fa-gauge-high"
                        label="Grid frequency"
                        value={`${fmt(ac.gridFrequency, 2)} Hz`}
                    />
                    <PRow
                        theme={theme}
                        icon="fa-gauge-high"
                        label="Frequency"
                        value={`${fmt(ac.frequencyHz, 2)} Hz`}
                    />
                    <PRow
                        theme={theme}
                        icon="fa-bolt"
                        label="Reactive power"
                        value={`${fmt(ac.reactivePowerKvar, 2)} kVar`}
                    />
                    <PRow
                        theme={theme}
                        icon="fa-bolt"
                        label="Apparent power"
                        value={`${fmt(ac.apparentPowerKva, 2)} kVA`}
                        sub={`PF ${fmt(ac.powerFactor, 2)}`}
                    />
                    <PRow
                        theme={theme}
                        icon="fa-bolt"
                        label="Keep-live power"
                        value={`${fmt(data?.live?.keepLivePowerKw, 2)} kW`}
                    />
                    <PRow
                        theme={theme}
                        icon="fa-bolt"
                        label="Active power"
                        value={`${fmt(ac.activePowerKw, 2)} kW`}
                    />
                    <PRow
                        theme={theme}
                        icon="fa-clock"
                        label="Updated"
                        value={fmtDate(inv.lastUpdated)}
                    />
                </div>
            </Panel>

            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                <Panel
                    theme={theme}
                    title="Inverter status"
                    icon="fa-microchip"
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <PRow
                            theme={theme}
                            icon="fa-power-off"
                            label="Status"
                            value={inv.status || "--"}
                        />
                        <PRow
                            theme={theme}
                            icon="fa-plug-circle-check"
                            label="Grid connection"
                            value={
                                inv.gridConnected ? "Connected" : "Disconnected"
                            }
                        />
                        <PRow
                            theme={theme}
                            icon="fa-temperature-half"
                            label="Temperature"
                            value={`${fmt(inv.temperatureC, 1)} °C`}
                        />
                        <PRow
                            theme={theme}
                            icon="fa-clock"
                            label="Today on-time"
                            value={onTime(inv.todayOnTimeHrs)}
                        />
                        <PRow
                            theme={theme}
                            icon="fa-clock"
                            label="Lifetime running"
                            value={onTime(inv.lifetimeRunningHrs)}
                        />
                        <PRow
                            theme={theme}
                            icon="fa-bolt"
                            label="Total energy"
                            value={`${fmt(inv.totalKwh, 2)} kWh`}
                        />
                        <PRow
                            theme={theme}
                            icon="fa-microchip"
                            label="Registered serial"
                            value={inv.registeredSerialNo || "--"}
                        />
                        <PRow
                            theme={theme}
                            icon="fa-mobile-screen-button"
                            label="Keep-live"
                            value={`${inv.keepLive ?? "--"}`}
                        />
                    </div>
                </Panel>

                <Panel
                    theme={theme}
                    title="Alarms & events"
                    icon="fa-bell"
                    action={
                        <div className="flex flex-wrap items-center gap-2">
                            <Tab
                                theme={theme}
                                active={alarmTab === "recent"}
                                onClick={() => setAlarmTab("recent")}
                            >
                                Recent ({recentAlarms.length})
                            </Tab>
                            <Tab
                                theme={theme}
                                active={alarmTab === "active"}
                                onClick={() => setAlarmTab("active")}
                            >
                                Active ({activeAlarms.length})
                            </Tab>

                            <select
                                value={alarmLimit}
                                onChange={(e) =>
                                    setAlarmLimit(Number(e.target.value))
                                }
                                aria-label="Number of alarms to show"
                                className={`rounded-full border cursor-pointer bg-transparent px-2 py-1 text-[11px] font-bold text-gray-700 dark:text-slate-200 ${theme.statBorder}`}
                            >
                                {ALARM_LIMITS.map((n) => (
                                    <option
                                        key={n}
                                        value={n}
                                        className="bg-white  text-gray-800 dark:bg-slate-800 dark:text-slate-100 "
                                    >
                                        Show {n}
                                    </option>
                                ))}
                            </select>
                        </div>
                    }
                >
                    {renderedAlarms.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                            <Icon
                                name="fa-circle-check"
                                className="h-8 w-8 text-emerald-600"
                            />
                            <p className="text-xs font-semibold text-gray-700 dark:text-slate-200">
                                No events in this view.
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                New alarms and recovery events will appear here.
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="mb-2 text-[10px] text-gray-500 dark:text-slate-400">
                                Showing {renderedAlarms.length} of{" "}
                                {currentAlarms.length}
                            </p>
                            {/* Scroll: list gets scrollable after ~288px */}
                            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                                {renderedAlarms.map((alarm, index) => {
                                    const recovered =
                                        alarm?.status === "Recovered" ||
                                        alarm?.cleared;
                                    return (
                                        <div
                                            key={`${alarm?.timeIso || alarm?.time || "alarm"}-${index}`}
                                            className={`flex gap-3 rounded-xl border p-3 ${theme.statBorder} ${theme.statBg}`}
                                        >
                                            <Icon
                                                name={alarmIcon(alarm)}
                                                className={`mt-0.5 h-4 w-4 shrink-0 ${recovered ? "text-emerald-600" : "text-amber-600"}`}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-gray-800 dark:text-slate-100">
                                                    {alarm?.message || "Event"}
                                                </p>
                                                <p className="mt-0.5 text-[10px] text-gray-500 dark:text-slate-400">
                                                    {alarm?.time || "--"}{" "}
                                                    {alarm?.endTime
                                                        ? `→ ${alarm.endTime}`
                                                        : ""}
                                                </p>
                                            </div>
                                            <span
                                                className="shrink-0 self-start rounded-full px-2 py-0.5 text-[10px] font-bold"
                                                style={{
                                                    color: recovered
                                                        ? "#16A34A"
                                                        : "#B45309",
                                                    backgroundColor: recovered
                                                        ? "#DCFCE7"
                                                        : "#FEF3C7",
                                                }}
                                            >
                                                {alarm?.status ||
                                                    (recovered
                                                        ? "Cleared"
                                                        : "Active")}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </Panel>
            </div>

            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <Panel
                    theme={theme}
                    title="Generation trend"
                    icon="fa-chart-line"
                    action={
                        <div className="flex gap-2">
                            {["Today", "7 Days", "30 Days"].map((item) => (
                                <Tab
                                    key={item}
                                    theme={theme}
                                    active={range === item}
                                    onClick={() => setRange(item)}
                                >
                                    {item}
                                </Tab>
                            ))}
                        </div>
                    }
                >
                    <TrendChart theme={theme} series={trend} unit={trendUnit} />
                    <p className="mt-2 text-center text-[10px] text-gray-500 dark:text-slate-400">
                        {range === "Today"
                            ? "Power output in kW"
                            : "Daily generation in kWh"}{" "}
                        · switch tabs to change the range
                    </p>
                </Panel>

                <Panel
                    theme={theme}
                    title={
                        range === "Today"
                            ? "Generation · Today"
                            : `Generation by day · ${range}`
                    }
                    icon="fa-chart-simple"
                >
                    <BarChart theme={theme} bars={bars} />
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
                        <div>
                            <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-slate-400">
                                7-day average
                            </p>
                            <p
                                className={`text-sm font-bold ${theme.textOnLight}`}
                            >
                                {fmt(weekAverage, 2)} kWh
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-slate-400">
                                vs previous 7 days
                            </p>
                            <p className="text-xs font-bold">
                                <Delta value={weekDelta} label="" />
                            </p>
                        </div>
                    </div>
                </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Panel
                    theme={theme}
                    title="Environmental impact"
                    icon="fa-leaf"
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Kpi
                            theme={theme}
                            icon="fa-leaf"
                            label="CO₂ saved"
                            value={`${fmt(en.co2SavedKg, 2)} kg`}
                            accent="#16A34A"
                        />
                        <Kpi
                            theme={theme}
                            icon="fa-tree"
                            label="Equivalent trees"
                            value={fmt(en.equivalentTrees, 2)}
                            accent="#16A34A"
                        />
                        <Kpi
                            theme={theme}
                            icon="fa-coins"
                            label="Trees planted"
                            value={fmt(en.treesPlanted, 0)}
                            accent="#16A34A"
                        />
                        <Kpi
                            theme={theme}
                            icon="fa-coins"
                            label="Estimated income"
                            value={fmt(en.income, 2)}
                            accent="#16A34A"
                        />
                    </div>
                </Panel>

                <Panel theme={theme} title="Communication" icon="fa-signal">
                    <Comm
                        theme={theme}
                        rows={[
                            {
                                label: "Inverter",
                                ok: comm.inverter === true,
                                sub: inv.status || "--",
                            },
                            {
                                label: "Data logger",
                                ok: comm.dataLogger === true,
                                sub: inv.collectorAddress || "--",
                            },
                            { label: "Internet", ok: comm.internet === true },
                            {
                                label: "Cloud",
                                ok: comm.cloud === true,
                                sub: `Source: ${data?.source || "--"}`,
                            },
                        ]}
                    />
                </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_1.25fr]">
                <Panel
                    theme={theme}
                    title="System health"
                    icon="fa-shield-halved"
                >
                    <Health
                        theme={theme}
                        value={healthPct}
                        color={healthColor}
                        status={
                            hasWarning
                                ? "Attention needed"
                                : "All systems normal"
                        }
                        dataStatus={data?.dataStatus}
                        lastDataReceived={comp.lastDataReceived}
                    />
                </Panel>

                <Panel theme={theme} title="Compliance" icon="fa-shield-halved">
                    <div className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(COMPLIANCE_LABELS).map(
                            ([key, label]) => (
                                <PRow
                                    key={key}
                                    theme={theme}
                                    icon={comp[key] ? "fa-check" : "fa-xmark"}
                                    label={label}
                                    value={comp[key] ? "Yes" : "No"}
                                />
                            ),
                        )}
                    </div>
                </Panel>
            </div>

            <Panel theme={theme} title="Account details" icon="fa-circle-info">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                    <PRow
                        theme={theme}
                        icon="fa-house"
                        label="Name"
                        value={info.station_name || user?.station_name || "--"}
                    />
                    <PRow
                        theme={theme}
                        icon="fa-solar-panel"
                        label="Station type"
                        value={user?.station_type || info.station_type || "--"}
                    />
                    <PRow
                        theme={theme}
                        icon="fa-microchip"
                        label="Model number"
                        value={user?.model_number || plant.modelNumber || "--"}
                    />

                    <PRow
                        theme={theme}
                        icon="fa-house"
                        label="City"
                        value={user?.your_city || "--"}
                    />
                    <PRow
                        theme={theme}
                        icon="fa-signal"
                        label="Collector address"
                        value={
                            user?.collector_address ||
                            inv.collectorAddress ||
                            "--"
                        }
                    />
                    <PRow
                        theme={theme}
                        icon="fa-microchip"
                        label="Inverter serial"
                        value={
                            user?.inverter_serial_number ||
                            inv.registeredSerialNo ||
                            "--"
                        }
                    />
                    <PRow
                        theme={theme}
                        icon="fa-phone"
                        label="Owner phone"
                        value={user?.owner_phone || plant.supportPhone || "--"}
                    />
                </div>
            </Panel>
        </section>
    );
}
