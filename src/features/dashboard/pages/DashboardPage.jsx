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

/* ════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════ */
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
const GEN_COLOR = "#F59E0B"; // generation line colour in the trend chart
const RANGES = ["Today", "7 Days", "30 Days"];

const COMPLIANCE_LABELS = {
    fiveMinReporting: "5-minute reporting",
    eventTransmission: "Event transmission",
    inverterMapping: "Inverter mapping",
    apiConnected: "API connected",
    dataStorageIndia: "Data stored in India",
    secureCommunication: "Secure communication",
};

function Icon({ name, className = "h-4 w-4", ...props }) {
    const Component = ICONS[name] || Info;
    return <Component className={className} {...props} />;
}

/* ════════════════════════════════════════════════════════════════
   HOOKS & HELPERS
   ════════════════════════════════════════════════════════════════ */

/* Animates a single number (used for the live AC power KPI) */
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

/* Animates an array of numbers (used by the charts) */
function useTweenArray(target, ms = 900) {
    const [val, setVal] = useState(() => target.map(() => 0));
    const cur = useRef(val);
    const key = JSON.stringify(target);

    useEffect(() => {
        const reduce =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        if (reduce) {
            cur.current = target;
            setVal(target);
            return undefined;
        }
        const from = cur.current;
        const fallback = from.length ? from[from.length - 1] : 0;
        const start = performance.now();
        let raf;
        const tick = (t) => {
            const p = Math.min((t - start) / ms, 1);
            const e = 1 - Math.pow(1 - p, 3);
            const next = target.map((v, i) => {
                const a = from[i] ?? fallback;
                return a + (v - a) * e;
            });
            cur.current = next;
            setVal(next);
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, ms]);

    return val;
}

/* Measures an element's width so charts draw at real pixel size
   (text stays readable on phones instead of shrinking) */
function useWidth(fallback = 600) {
    const ref = useRef(null);
    const [width, setWidth] = useState(fallback);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const update = () => setWidth(el.clientWidth || fallback);
        update();
        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", update);
            return () => window.removeEventListener("resize", update);
        }
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [fallback]);

    return [ref, width];
}

/* Nice Y-axis: round max + evenly spaced ticks.
   `ticks` stay exact (used for positions); `labels` are the formatted text,
   with just enough decimals for the step (0.025 → "0.025", not "0.03"). */
const niceAxis = (m, n = 5) => {
    const raw = (m > 0 ? m : 1) / n;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw);
    let dec = Math.max(0, -Math.floor(Math.log10(step)));
    if (Math.abs(step * 10 ** dec - Math.round(step * 10 ** dec)) > 1e-9)
        dec += 1;
    const ticks = Array.from({ length: n + 1 }, (_, i) => i * step);
    return {
        max: step * n,
        ticks,
        labels: ticks.map((t) => String(+t.toFixed(dec))),
    };
};

/* value label on top of a bar: small numbers keep 2 decimals (0.02, not 0) */
const barLabel = (v) => String(+v.toFixed(v > 0 && v < 1 ? 2 : 1));

function alarmIcon(alarm) {
    const message = String(alarm?.message || "").toLowerCase();
    if (message.includes("grid") || message.includes("ac"))
        return "fa-plug-circle-check";
    if (message.includes("temp")) return "fa-temperature-half";
    if (alarm?.status === "Recovered" || message.includes("clear"))
        return "fa-circle-check";
    return "fa-triangle-exclamation";
}

/* ════════════════════════════════════════════════════════════════
   SMALL UI PIECES
   ════════════════════════════════════════════════════════════════ */
function PulseDot({ active, color }) {
    return (
        <span className="relative flex h-2 w-2">
            {active && (
                <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none"
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
            className={`flex  h-full min-w-0 flex-col rounded-2xl border shadow-sm ${theme.card} ${theme.statBorder} ${theme.cardHover ?? ""} ${className}`}
        >
            {children}
        </div>
    );
}

function Title({ theme, icon, children, action }) {
    return (
        <div
            className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 py-3 sm:gap-3 sm:px-5 sm:py-4 ${theme.statBorder}`}
        >
            <div className="flex min-w-0 items-center gap-2">
                <Icon
                    name={icon}
                    className={`h-4 w-4 shrink-0 ${theme.icon}`}
                />
                <h2 className="truncate text-sm font-bold text-gray-900 dark:text-slate-100">
                    {children}
                </h2>
            </div>
            {action && (
                <div className="flex max-w-full flex-wrap items-center gap-2">
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
            {/* flex-1: the body fills the card, so cards in one row end level */}
            <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-5">
                {children}
            </div>
        </Card>
    );
}

function Kpi({ theme, icon, label, value, sub, accent }) {
    return (
        <article
            className={`relative min-w-0 overflow-hidden rounded-xl border p-3 transition hover:-translate-y-0.5 hover:shadow-md sm:p-4 ${theme.statBg} ${theme.statBorder}`}
        >
            <span
                className={`absolute inset-x-0 top-0 h-0.5 ${theme.accentBg}`}
            />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                        {label}
                    </p>
                    <p
                        className={`mt-2 truncate text-lg font-bold sm:text-xl xl:text-2xl ${theme.textOnLight}`}
                    >
                        {value}
                    </p>
                </div>
                <span className={`shrink-0 rounded-lg p-2 ${theme.glow}`}>
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
            className={`flex min-w-0 items-center justify-between gap-3 rounded-xl px-3 py-2 ${theme.statBg}`}
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
function InfoLine({ theme, icon, label, value, onHero }) {
    return (
        <div className="flex min-w-0 items-start gap-3">
            <Icon
                name={icon}
                className={`mt-1 h-4 w-4 shrink-0 ${onHero ? "text-white/80" : theme.icon}`}
            />
            <div className="min-w-0">
                <p
                    className={`text-[10px] font-semibold uppercase tracking-wide ${onHero ? "text-white/70" : "text-gray-500 dark:text-slate-400"}`}
                >
                    {label}
                </p>
                <p
                    className={`break-all text-sm font-bold ${onHero ? "text-white" : theme.textOnLight}`}
                >
                    {value}
                </p>
            </div>
        </div>
    );
}

/* Grouped card: coloured header bar + label (left) / value (right) rows */
function ParamGroup({ theme, icon, title, rows }) {
    return (
        <div
            className={`min-w-0 overflow-hidden rounded-xl border ${theme.statBorder} ${theme.statBg}`}
        >
            <div
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-white ${theme.accentBg}`}
            >
                <Icon name={icon} className="h-4 w-4 shrink-0" />
                <span className="truncate">{title}</span>
            </div>
            <div>
                {rows.map(([label, value, sub]) => (
                    <div
                        key={label}
                        className={`flex items-center justify-between gap-3 border-b px-3 py-2.5 text-xs last:border-b-0 ${theme.statBorder}`}
                    >
                        <div className="min-w-0">
                            <p className="truncate text-gray-500 dark:text-slate-400">
                                {label}
                            </p>
                            {sub && (
                                <p className="truncate text-[10px] text-gray-400 dark:text-slate-500">
                                    {sub}
                                </p>
                            )}
                        </div>
                        <p className="shrink-0 text-right font-bold text-gray-900 dark:text-slate-100">
                            {value}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Tab({ theme, active, children, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`cursor-pointer whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold transition sm:px-3 ${
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
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-slate-100">
                            {label}
                        </p>
                        {sub && (
                            <p className="truncate text-[10px] text-gray-500 dark:text-slate-400">
                                {sub}
                            </p>
                        )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
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

/* ════════════════════════════════════════════════════════════════
   SYSTEM HEALTH (ring driven by inverter status)
   ════════════════════════════════════════════════════════════════ */
function Health({
    theme,
    value,
    color,
    label,
    status,
    dataStatus,
    lastDataReceived,
}) {
    const radius = 46;
    const circumference = 2 * Math.PI * radius;
    const dash = (Math.min(Math.max(value, 0), 100) / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
                <svg
                    viewBox="0 0 120 120"
                    className="h-full w-full -rotate-90"
                    aria-hidden="true"
                >
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
                        style={{
                            transition: "stroke-dasharray 600ms ease-out",
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                        {fmt(value, 0)}%
                    </span>
                    <span
                        className="text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color }}
                    >
                        {label}
                    </span>
                </div>
            </div>
            <div
                className={`w-full min-w-0 flex-1 rounded-xl border p-3 sm:p-4 ${theme.statBorder} ${theme.statBg}`}
            >
                <p className="text-xs font-bold text-gray-800 dark:text-slate-100">
                    System status
                </p>
                <p className="mt-1 text-sm font-semibold" style={{ color }}>
                    {status}
                </p>
                <div className="mt-3 space-y-1 text-[11px] text-gray-500 dark:text-slate-400">
                    <p>
                        Inverter status:{" "}
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

/* ════════════════════════════════════════════════════════════════
   CHARTS
   ════════════════════════════════════════════════════════════════ */
function ChartEmpty({ icon, title }) {
    return (
        <div className="flex h-48 flex-col items-center justify-center gap-1 text-center sm:h-56">
            <Icon
                name={icon}
                className="h-8 w-8 text-gray-300 dark:text-slate-600"
            />
            <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                {title}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
                Try the 7 Days or 30 Days tab.
            </p>
        </div>
    );
}

/* Dual-axis trend: AC power (left, solid) + generation (right, dashed + area) */
function TrendChart({ theme, labels = [], power = [], gen = [] }) {
    const GEN = theme.chartAlt ?? GEN_COLOR; // generation colour from the theme
    const [wrapRef, width] = useWidth(620);
    const power_ = useTweenArray(power);
    const gen_ = useTweenArray(gen);
    const [hover, setHover] = useState(null);

    const hasPower = power.some((v) => v > 0);
    const hasGen = gen.some((v) => v > 0);
    const empty = !labels.length || (!hasPower && !hasGen);

    const compact = width < 480;
    const W = Math.max(width, 260);
    const H = compact ? 210 : 250;
    const L = hasPower ? (compact ? 34 : 42) : 12;
    const R = hasGen ? (compact ? 40 : 50) : 12;
    const T = 32; // room for the kW / kWh unit labels above the plot
    const B = 28;
    const iw = W - L - R;
    const ih = H - T - B;
    const fs = compact ? 10 : 11;

    const aP = niceAxis(Math.max(...power, 0), compact ? 4 : 5);
    const aG = niceAxis(Math.max(...gen, 0), compact ? 4 : 5);
    const n = Math.max(labels.length - 1, 1);
    const lastI = labels.length - 1;

    const x = (i) => L + (i / n) * iw;
    const yP = (v) => T + ih - ((v ?? 0) / aP.max) * ih;
    const yG = (v) => T + ih - ((v ?? 0) / aG.max) * ih;
    const path = (a, fy) =>
        a
            .slice(0, labels.length)
            .map((v, i) => `${i ? "L" : "M"}${x(i)},${fy(v)}`)
            .join(" ");

    // fit X labels to the available width (~56px per label)
    const maxLabels = Math.max(2, Math.floor(iw / 56));
    const step = Math.ceil(labels.length / maxLabels) || 1;

    /* pointer X → nearest data index */
    const onMove = (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * W;
        if (px < L - 8 || px > W - R + 8) return setHover(null);
        const i = Math.round(((px - L) / iw) * n);
        setHover(Math.min(Math.max(i, 0), lastI));
    };

    return (
        <div ref={wrapRef} className="w-full min-w-0">
            {empty ? (
                <ChartEmpty
                    icon="fa-chart-line"
                    title="No data for this period"
                />
            ) : (
                <svg
                    width={W}
                    height={H}
                    viewBox={`0 0 ${W} ${H}`}
                    className="block w-full cursor-crosshair select-none"
                    style={{ touchAction: "pan-y" }}
                    role="img"
                    aria-label="Generation and power trend"
                    onPointerMove={onMove}
                    onPointerDown={onMove}
                    onPointerLeave={() => setHover(null)}
                >
                    {/* grid + both Y axes.
                        Both axes have the same number of ticks, so tick i sits
                        at the same height on the left and right: one grid line,
                        two labels, always aligned. */}
                    {aG.ticks.map((_, i) => {
                        const gy = T + ih - (i / (aG.ticks.length - 1)) * ih;
                        return (
                            <g key={`tick-${i}`}>
                                <line
                                    x1={L}
                                    x2={W - R}
                                    y1={gy}
                                    y2={gy}
                                    className="stroke-gray-200 dark:stroke-slate-700"
                                />
                                {hasPower && (
                                    <text
                                        x={L - 6}
                                        y={gy}
                                        dominantBaseline="middle"
                                        fontSize={fs}
                                        textAnchor="end"
                                        className="fill-gray-400 dark:fill-slate-500"
                                    >
                                        {aP.labels[i]}
                                    </text>
                                )}
                                {hasGen && (
                                    <text
                                        x={W - R + 6}
                                        y={gy}
                                        dominantBaseline="middle"
                                        fontSize={fs}
                                        textAnchor="start"
                                        className="fill-gray-400 dark:fill-slate-500"
                                    >
                                        {aG.labels[i]}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                    {hasPower && (
                        <text
                            x={L - 6}
                            y={14}
                            fontSize={fs}
                            fontWeight="600"
                            textAnchor="end"
                            className="fill-gray-500 dark:fill-slate-400"
                        >
                            kW
                        </text>
                    )}
                    {hasGen && (
                        <text
                            x={W - R + 6}
                            y={14}
                            fontSize={fs}
                            fontWeight="600"
                            textAnchor="start"
                            className="fill-gray-500 dark:fill-slate-400"
                        >
                            kWh
                        </text>
                    )}

                    {/* generation: area + dashed line (right axis) */}
                    {hasGen && (
                        <>
                            <path
                                d={`${path(gen_, yG)} L${x(lastI)},${yG(0)} L${x(0)},${yG(0)} Z`}
                                fill={GEN}
                                opacity={hover === null ? 0.12 : 0.18}
                                style={{ transition: "opacity 200ms" }}
                            />
                            <path
                                d={path(gen_, yG)}
                                fill="none"
                                stroke={GEN}
                                strokeWidth="2"
                                strokeDasharray="5 4"
                            />
                        </>
                    )}

                    {/* power: solid line (left axis) */}
                    {hasPower && (
                        <path
                            d={path(power_, yP)}
                            fill="none"
                            stroke={theme.chart}
                            strokeWidth={hover === null ? 2.5 : 3}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            style={{ transition: "stroke-width 200ms" }}
                        />
                    )}

                    {/* pulsing "live" dot on the last point */}
                    {hasPower && hover === null && (
                        <g>
                            <circle
                                cx={x(lastI)}
                                cy={yP(power_[lastI])}
                                r="3.5"
                                fill={theme.chart}
                            />
                            <circle
                                cx={x(lastI)}
                                cy={yP(power_[lastI])}
                                r="3.5"
                                fill={theme.chart}
                            >
                                <animate
                                    attributeName="r"
                                    values="3.5;10;3.5"
                                    dur="1.8s"
                                    repeatCount="indefinite"
                                />
                                <animate
                                    attributeName="opacity"
                                    values="0.5;0;0.5"
                                    dur="1.8s"
                                    repeatCount="indefinite"
                                />
                            </circle>
                        </g>
                    )}

                    {/* X labels */}
                    {labels.map((l, i) =>
                        i % step === 0 ? (
                            <text
                                key={`${l}-${i}`}
                                x={x(i)}
                                y={H - 8}
                                fontSize={fs}
                                textAnchor={
                                    i === 0
                                        ? "start"
                                        : i === lastI
                                          ? "end"
                                          : "middle"
                                }
                                className="fill-gray-400 dark:fill-slate-500"
                            >
                                {l}
                            </text>
                        ) : null,
                    )}

                    {/* hover: crosshair + dots + tooltip */}
                    {hover !== null &&
                        (() => {
                            const hx = x(hover);
                            const tw = compact ? 128 : 144;
                            const th = hasPower && hasGen ? 58 : 42;
                            const tx =
                                hx + 12 + tw > W - 4
                                    ? Math.max(4, hx - 12 - tw)
                                    : hx + 12;
                            return (
                                <g pointerEvents="none">
                                    <line
                                        x1={hx}
                                        x2={hx}
                                        y1={T}
                                        y2={T + ih}
                                        stroke={theme.chart}
                                        strokeDasharray="3 3"
                                        opacity="0.6"
                                    />
                                    {hasGen && (
                                        <circle
                                            cx={hx}
                                            cy={yG(gen_[hover])}
                                            r="4.5"
                                            className="fill-white dark:fill-slate-900"
                                            stroke={GEN}
                                            strokeWidth="2"
                                        />
                                    )}
                                    {hasPower && (
                                        <circle
                                            cx={hx}
                                            cy={yP(power_[hover])}
                                            r="5"
                                            className="fill-white dark:fill-slate-900"
                                            stroke={theme.chart}
                                            strokeWidth="2.5"
                                        />
                                    )}
                                    <g transform={`translate(${tx},${T + 2})`}>
                                        <rect
                                            width={tw}
                                            height={th}
                                            rx="8"
                                            className="fill-white stroke-gray-200 dark:fill-slate-800 dark:stroke-slate-700"
                                            style={{
                                                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.15))",
                                            }}
                                        />
                                        <text
                                            x="10"
                                            y="17"
                                            fontSize={fs}
                                            fontWeight="700"
                                            className="fill-gray-800 dark:fill-slate-100"
                                        >
                                            {labels[hover]}
                                        </text>
                                        {hasPower && (
                                            <text
                                                x="10"
                                                y="34"
                                                fontSize={fs}
                                                fill={theme.chart}
                                            >
                                                AC power: {fmt(power[hover], 2)}{" "}
                                                kW
                                            </text>
                                        )}
                                        {hasGen && (
                                            <text
                                                x="10"
                                                y={hasPower ? 50 : 34}
                                                fontSize={fs}
                                                fill={GEN}
                                            >
                                                Generation: {fmt(gen[hover], 2)}{" "}
                                                kWh
                                            </text>
                                        )}
                                    </g>
                                </g>
                            );
                        })()}
                </svg>
            )}
        </div>
    );
}

/* Daily energy bars with per-bar hover tooltip */
function BarChart({ theme, data = [] }) {
    const [wrapRef, width] = useWidth(400);
    const values = data.map((d) => axis(d?.kwh));
    const vals = useTweenArray(values);
    const [hover, setHover] = useState(null);

    const empty = !data.length || values.every((v) => v === 0);

    const compact = width < 400;
    const W = Math.max(width, 240);
    const H = compact ? 210 : 250; // same height as the trend chart
    const L = compact ? 34 : 40;
    const T = 32;
    const B = 28;
    const iw = W - L - 8;
    const ih = H - T - B;
    const fs = compact ? 9 : 10;

    const a = niceAxis(Math.max(...values, 0), compact ? 4 : 5);
    const bw = iw / (data.length || 1);
    const showVal = data.length <= 12 && bw >= 26; // value on top only if it fits
    const maxLabels = Math.max(2, Math.floor(iw / 44));
    const lStep = Math.ceil(data.length / maxLabels) || 1;

    return (
        <div ref={wrapRef} className="w-full min-w-0">
            {empty ? (
                <ChartEmpty
                    icon="fa-chart-simple"
                    title="No generation recorded"
                />
            ) : (
                <svg
                    width={W}
                    height={H}
                    viewBox={`0 0 ${W} ${H}`}
                    className="block w-full select-none"
                    style={{ touchAction: "pan-y" }}
                    role="img"
                    aria-label="Daily energy generation"
                    onPointerLeave={() => setHover(null)}
                >
                    {a.ticks.map((t, i) => {
                        const y = T + ih - (t / a.max) * ih;
                        return (
                            <g key={`tick-${i}`}>
                                <line
                                    x1={L}
                                    x2={W - 8}
                                    y1={y}
                                    y2={y}
                                    className="stroke-gray-200 dark:stroke-slate-700"
                                />
                                <text
                                    x={L - 6}
                                    y={y}
                                    dominantBaseline="middle"
                                    fontSize={fs}
                                    textAnchor="end"
                                    className="fill-gray-400 dark:fill-slate-500"
                                >
                                    {a.labels[i]}
                                </text>
                            </g>
                        );
                    })}
                    <text
                        x={L - 6}
                        y={14}
                        fontSize={fs}
                        fontWeight="600"
                        textAnchor="end"
                        className="fill-gray-500 dark:fill-slate-400"
                    >
                        kWh
                    </text>

                    {data.map((d, i) => {
                        const v = vals[i] ?? 0;
                        const h = Math.max((v / a.max) * ih, 2); // 0 kWh still shows 2px
                        const bx = L + i * bw + bw * 0.2;
                        const last = i === data.length - 1;
                        const hot = hover === i;
                        return (
                            <g
                                key={`${d.label}-${i}`}
                                className="cursor-pointer"
                                onPointerEnter={() => setHover(i)}
                                onPointerDown={() => setHover(i)}
                            >
                                {/* full-height hover strip: easy to hit even on short bars */}
                                <rect
                                    x={L + i * bw}
                                    y={T}
                                    width={bw}
                                    height={ih}
                                    fill={theme.chart}
                                    opacity={hot ? 0.08 : 0}
                                    style={{ transition: "opacity 150ms" }}
                                />
                                <rect
                                    x={bx}
                                    y={T + ih - h}
                                    width={Math.max(bw * 0.6, 1)}
                                    height={h}
                                    rx={bw > 10 ? 3 : 1}
                                    fill={
                                        hot || last
                                            ? theme.chart
                                            : (theme.chartSoft ?? theme.chart)
                                    }
                                    opacity={
                                        hot || last
                                            ? 1
                                            : theme.chartSoft
                                              ? 1
                                              : 0.55
                                    }
                                    style={{ transition: "opacity 150ms" }}
                                >
                                    {last && !hot && (
                                        <animate
                                            attributeName="opacity"
                                            values="1;0.65;1"
                                            dur="2s"
                                            repeatCount="indefinite"
                                        />
                                    )}
                                </rect>
                                {showVal && (
                                    <text
                                        x={bx + bw * 0.3}
                                        y={T + ih - h - 5}
                                        fontSize={fs}
                                        fontWeight="700"
                                        textAnchor="middle"
                                        className="fill-gray-700 dark:fill-slate-200"
                                    >
                                        {barLabel(v)}
                                    </text>
                                )}
                                {i % lStep === 0 && (
                                    <text
                                        x={bx + bw * 0.3}
                                        y={H - 8}
                                        fontSize={fs}
                                        fontWeight={hot ? "700" : "400"}
                                        textAnchor="middle"
                                        className="fill-gray-500 dark:fill-slate-400"
                                    >
                                        {d.label}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* tooltip */}
                    {hover !== null &&
                        data[hover] &&
                        (() => {
                            const h = Math.max(
                                ((vals[hover] ?? 0) / a.max) * ih,
                                2,
                            );
                            const cx = L + hover * bw + bw * 0.5;
                            const tw = 104;
                            const th = 38;
                            const tx = Math.min(
                                Math.max(cx - tw / 2, 2),
                                W - tw - 2,
                            );
                            const ty = Math.max(2, T + ih - h - th - 20);
                            return (
                                <g
                                    pointerEvents="none"
                                    transform={`translate(${tx},${ty})`}
                                >
                                    <rect
                                        width={tw}
                                        height={th}
                                        rx="8"
                                        className="fill-white stroke-gray-200 dark:fill-slate-800 dark:stroke-slate-700"
                                        style={{
                                            filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.15))",
                                        }}
                                    />
                                    <text
                                        x={tw / 2}
                                        y="15"
                                        fontSize="11"
                                        fontWeight="700"
                                        textAnchor="middle"
                                        className="fill-gray-800 dark:fill-slate-100"
                                    >
                                        {data[hover].label}
                                    </text>
                                    <text
                                        x={tw / 2}
                                        y="30"
                                        fontSize="11"
                                        textAnchor="middle"
                                        fill={theme.chart}
                                    >
                                        {fmt(data[hover].kwh, 2)} kWh
                                    </text>
                                </g>
                            );
                        })()}
                </svg>
            )}
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════
   ENERGY FLOW (Solar → Inverter → Grid + Home)
   ════════════════════════════════════════════════════════════════ */
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

function FlowLine({ theme, d, active, dots = 3, dur = 3, light }) {
    return (
        <g>
            <path
                d={d}
                fill="none"
                stroke={
                    active
                        ? light
                            ? "#FFFFFF"
                            : theme.chart
                        : light
                          ? "rgba(255,255,255,0.35)"
                          : "#D1D5DB"
                }
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={active ? undefined : "4 7"}
                opacity={active ? 0.35 : 1}
            />
            {active &&
                Array.from({ length: dots }, (_, i) => (
                    <circle
                        key={i}
                        r="4.5"
                        fill={light ? "#FFFFFF" : theme.chart}
                    >
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

function FlowNode({
    theme,
    x,
    y,
    r = 36,
    icon,
    label,
    value,
    active,
    pulse,
    light,
}) {
    const color = active
        ? light
            ? "#FFFFFF"
            : theme.chart
        : light
          ? "rgba(255,255,255,0.6)"
          : "#9CA3AF";
    const size = r * 0.95;
    return (
        <g transform={`translate(${x},${y})`}>
            {pulse && active && (
                <circle
                    r={r}
                    fill={light ? "#FFFFFF" : theme.chart}
                    opacity="0.2"
                >
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
                className={light ? undefined : "fill-white dark:fill-slate-900"}
                fill={light ? "rgba(255,255,255,0.12)" : undefined}
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
                className={
                    light ? undefined : "fill-gray-800 dark:fill-slate-100"
                }
                fill={light ? "#FFFFFF" : undefined}
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
    light,
}) {
    return (
        <div className="-mx-1 overflow-x-auto px-1">
            <svg
                viewBox="0 0 800 266"
                className="h-auto w-full min-w-[340px]"
                role="img"
                aria-label="Energy flow from solar to inverter, grid and home"
            >
                <FlowLine
                    light={light}
                    theme={theme}
                    active={flowing}
                    d="M128 110 L322 110"
                    dots={3}
                    dur={3}
                />
                <FlowLine
                    light={light}
                    theme={theme}
                    active={flowing}
                    d="M398 110 C500 110 520 52 622 52"
                    dots={3}
                    dur={3.4}
                />
                <FlowLine
                    light={light}
                    theme={theme}
                    active={flowing}
                    d="M398 110 C500 110 520 170 622 170"
                    dots={2}
                    dur={3.4}
                />

                <FlowNode
                    light={light}
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
                    light={light}
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
                    light={light}
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
                    light={light}
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

/* ════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════ */
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

    /* ── status ── */
    const livePower = axis(ac.activePowerKw);
    const animatedPower = useTween(livePower);
    const inverterStatus = String(inv.status || "").toUpperCase();
    const isOnline = inverterStatus === "RUNNING";
    const isPlantOffline = isOffline(plant);
    const flowing = !isPlantOffline; // flow dots move only while plant is not offline
    const dataIsLive = String(data?.dataStatus || "").toLowerCase() === "live";
    const statusText = isPlantOffline
        ? "No plant communication"
        : isOnline
          ? "Generating power"
          : "Inverter offline";
    const onHero = Boolean(theme.heroBg); // hero card uses the theme gradient
    const hasWarning = isPlantOffline || !isOnline || activeAlarms.length > 0;

    /* ── energy / 7-day performance ── */
    const todayDelta = pct(en.todayKwh, en.yesterdayKwh);
    const weekDelta = pct(en.last7DaysKwh, en.previous7DaysKwh);
    const weekTotal = nums(week.map((item) => item?.kwh)).reduce(
        (sum, value) => sum + value,
        0,
    );
    const weekAverage = week.length ? weekTotal / week.length : 0;
    const weekTotalKwh =
        en.last7DaysKwh != null ? axis(en.last7DaysKwh) : weekTotal;

    /* ── system health (by inverter status) ── */
    const health = isPlantOffline
        ? {
              pct: 0,
              color: "#DC2626",
              label: "Offline",
              status: "No plant communication",
          }
        : isOnline && activeAlarms.length > 0
          ? {
                pct: 70,
                color: "#F59E0B",
                label: "Warning",
                status: `${activeAlarms.length} active alarm(s)`,
            }
          : isOnline
            ? {
                  pct: 100,
                  color: "#16A34A",
                  label: "Healthy",
                  status: "Inverter running normally",
              }
            : {
                  pct: 0,
                  color: "#DC2626",
                  label: "Offline",
                  status: `Inverter ${inv.status || "not responding"}`,
              };

    /* ── bar chart data ── */
    const bars = useMemo(() => {
        if (range === "Today") {
            const t = hist.today;
            if (Array.isArray(t) && t.length) {
                return t.map((item) => ({
                    label: item?.label ?? fmtTime(item?.time),
                    kwh: axis(item?.kwh ?? item?.generationKwh),
                }));
            }
            const labels = arr(t?.labels);
            const gen = arr(t?.generationKwh);
            if (labels.length && gen.length === labels.length) {
                return labels.map((l, i) => ({ label: l, kwh: axis(gen[i]) }));
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

    /* ── trend chart data: { labels, power, gen } ── */
    const trend = useMemo(() => {
        if (range === "Today") {
            const t = hist.today;
            if (Array.isArray(t)) {
                return {
                    labels: t.map((i) => i?.label ?? fmtTime(i?.time)),
                    power: t.map((i) => axis(i?.powerKw)),
                    gen: t.map((i) => axis(i?.kwh ?? i?.generationKwh)),
                };
            }
            return {
                labels: arr(t?.labels),
                power: arr(t?.powerKw).map((v) => axis(v)),
                gen: arr(t?.generationKwh).map((v) => axis(v)),
            };
        }
        const src =
            range === "7 Days" ? arr(hist.last7Days) : arr(hist.last30Days);
        return {
            labels: src.map((i) => i?.label ?? i?.day ?? "--"),
            // real peak power if the API sends it; otherwise the power line hides
            power: src.map((i) => axis(i?.peakPowerKw ?? i?.powerKw)),
            gen: src.map((i) => axis(i?.kwh)),
        };
    }, [range, hist]);

    const currentAlarms = alarmTab === "active" ? activeAlarms : recentAlarms;
    const renderedAlarms = currentAlarms.slice(0, alarmLimit);

    /* ── loading / error ── */
    if (loading && !data) {
        return (
            <div
                role="status"
                className={`flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center ${theme.pageBg}`}
            >
                <span
                    className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 motion-reduce:animate-none"
                    style={{ borderTopColor: theme.chart }}
                    aria-hidden="true"
                />
                <p className="text-sm text-gray-500 dark:text-slate-400">
                    Loading your solar data…
                </p>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div
                className={`flex min-h-[50vh] flex-col items-center justify-center p-6 text-center ${theme.pageBg}`}
            >
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
            className={`space-y-4 overflow-x-hidden p-3 sm:p-5 lg:p-6 xl:p-8 ${theme.pageBg}`}
        >
            {error && (
                <p
                    role="alert"
                    className={`rounded-lg border px-3 py-2 text-xs ${theme.statBorder} ${theme.statBg} ${theme.textOnLight}`}
                >
                    Could not refresh. Showing the last values received.
                </p>
            )}

            {/* ── Hero ── */}
            <Card
                theme={theme}
                className={`relative overflow-hidden p-4 sm:p-6 ${theme.heroBg ?? ""}`}
            >
                <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-center">
                    {/* LEFT: title + details */}
                    <div className="min-w-0">
                        <p
                            className={`text-[11px] font-bold uppercase tracking-[0.2em] ${onHero ? "text-white/80" : theme.textOnLight}`}
                        >
                            {user?.version_type ||
                                info.version_type ||
                                "Portal"}{" "}
                            dashboard
                        </p>
                        <h1
                            className={`mt-2 wrap-break-word text-xl font-bold sm:text-2xl ${onHero ? "text-white" : "text-gray-900 dark:text-slate-100"}`}
                        >
                            {plant.name ||
                                user?.station_name ||
                                info.station_name ||
                                "Welcome"}
                        </h1>
                        <p
                            className={`mt-1 text-sm ${onHero ? "text-white/75" : "text-gray-500 dark:text-slate-400"}`}
                        >
                            {plant.systemTitle ||
                                user?.station_type ||
                                "Solar monitoring overview"}
                        </p>

                        <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 min-[420px]:grid-cols-2">
                            <InfoLine
                                onHero={onHero}
                                theme={theme}
                                icon="fa-bolt"
                                label="Capacity"
                                value={`${fmt(plant.capacityKwp, 2)} kWp`}
                            />
                            <InfoLine
                                onHero={onHero}
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
                                onHero={onHero}
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
                                onHero={onHero}
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

                    {/* RIGHT: status badges + energy flow */}
                    <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2 lg:justify-end">
                            <span
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold ${theme.inverterStatus}`}
                            >
                                <PulseDot
                                    active={isOnline && dataIsLive}
                                    color={isOnline ? "#16A34A" : "#DC2626"}
                                />
                                {isOnline && dataIsLive ? "LIVE" : "OFFLINE"}
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
                            light={onHero}
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

            {/* ── KPIs ── */}
            <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
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

            {/* ── Real-time electrical parameters (3 grouped cards) ── */}
            <Panel
                theme={theme}
                title="Real-time electrical parameters"
                icon="fa-plug-circle-check"
                action={
                    <span className="text-[11px] text-gray-500 dark:text-slate-400">
                        Updated {fmtDate(inv.lastUpdated)}
                    </span>
                }
            >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <ParamGroup
                        theme={theme}
                        icon="fa-sun"
                        title="DC side (PV input)"
                        rows={[
                            ["DC voltage", `${fmt(dc.voltageV, 1)} V`],
                            ["DC current", `${fmt(dc.currentA, 2)} A`],
                            [
                                "DC power",
                                `${fmt(dc.powerW, 0)} W`,
                                `${arr(dc.mppt).length} MPPT channels`,
                            ],
                        ]}
                    />
                    <ParamGroup
                        theme={theme}
                        icon="fa-plug-circle-check"
                        title="AC side (grid output)"
                        rows={[
                            ["Phase voltage", `${fmt(ac.phaseVoltageV, 1)} V`],
                            ["Phase current", `${fmt(ac.phaseCurrentA, 2)} A`],
                            [
                                "Grid frequency",
                                `${fmt(ac.gridFrequency, 2)} Hz`,
                            ],
                        ]}
                    />
                    <ParamGroup
                        theme={theme}
                        icon="fa-bolt"
                        title="Total AC"
                        rows={[
                            ["Active power", `${fmt(ac.activePowerKw, 2)} kW`],
                            [
                                "Apparent power",
                                `${fmt(ac.apparentPowerKva, 2)} kVA`,
                            ],
                            [
                                "Reactive power",
                                `${fmt(ac.reactivePowerKvar, 2)} kVAr`,
                            ],
                            ["Power factor", fmt(ac.powerFactor, 2)],
                            ["Frequency", `${fmt(ac.frequencyHz, 2)} Hz`],
                            [
                                "Keep-live power",
                                `${fmt(data?.live?.keepLivePowerKw, 2)} kW`,
                            ],
                        ]}
                    />
                </div>
            </Panel>

            {/* ── Inverter status | Alarms ── */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                <Panel
                    theme={theme}
                    title="Inverter status"
                    icon="fa-microchip"
                >
                    {/* fills the card height, so no empty space under the data */}
                    <div className="flex h-full flex-col gap-4">
                        {/* big status line */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                                    style={{
                                        color: isOnline ? "#16A34A" : "#DC2626",
                                        backgroundColor: isOnline
                                            ? "rgba(22,163,74,0.12)"
                                            : "rgba(220,38,38,0.12)",
                                    }}
                                >
                                    <Icon
                                        name={
                                            isOnline
                                                ? "fa-circle-check"
                                                : "fa-circle-xmark"
                                        }
                                        className="h-6 w-6"
                                    />
                                </span>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                                        Inverter status
                                    </p>
                                    <p
                                        className="text-xl font-bold"
                                        style={{
                                            color: isOnline
                                                ? "#16A34A"
                                                : "#DC2626",
                                        }}
                                    >
                                        {inv.status || "--"}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                                    Grid status
                                </p>
                                <p
                                    className="text-sm font-bold"
                                    style={{
                                        color: inv.gridConnected
                                            ? "#16A34A"
                                            : "#DC2626",
                                    }}
                                >
                                    {inv.gridConnected
                                        ? "Connected"
                                        : "Disconnected"}
                                </p>
                            </div>
                        </div>

                        {/* four stat tiles */}
                        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                            {[
                                [
                                    "fa-temperature-half",
                                    "Temperature",
                                    `${fmt(inv.temperatureC, 1)} °C`,
                                ],
                                [
                                    "fa-clock",
                                    "Today on-time",
                                    onTime(inv.todayOnTimeHrs),
                                ],
                                [
                                    "fa-clock",
                                    "Lifetime running",
                                    onTime(inv.lifetimeRunningHrs),
                                ],
                                [
                                    "fa-bolt",
                                    "Total energy",
                                    `${fmt(inv.totalKwh, 2)} kWh`,
                                ],
                            ].map(([icon, label, value]) => (
                                <div
                                    key={label}
                                    className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${theme.statBorder} ${theme.statBg}`}
                                >
                                    <span
                                        className={`shrink-0 rounded-lg p-2 ${theme.glow}`}
                                    >
                                        <Icon
                                            name={icon}
                                            className={`h-4 w-4 ${theme.icon}`}
                                        />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-[11px] text-gray-500 dark:text-slate-400">
                                            {label}
                                        </p>
                                        <p
                                            className={`truncate text-base font-bold ${theme.textOnLight}`}
                                        >
                                            {value}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* details: label left, value right */}
                        <div
                            className={`mt-auto overflow-hidden rounded-xl border ${theme.statBorder} ${theme.statBg}`}
                        >
                            {[
                                [
                                    "Inverter Serial Number",
                                    inv.registeredSerialNo || "--",
                                ],
                                ["Keep-live", `${inv.keepLive ?? "--"}`],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className={`flex items-center justify-between gap-3 border-b px-3 py-2.5 text-xs last:border-b-0 ${theme.statBorder}`}
                                >
                                    <span className="text-gray-500 dark:text-slate-400">
                                        {label}
                                    </span>
                                    <span className="break-all text-right font-bold text-gray-900 dark:text-slate-100">
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Panel>

                <Panel
                    theme={theme}
                    title="Alarms & events"
                    icon="fa-bell"
                    action={
                        <>
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
                                className={`cursor-pointer rounded-full border bg-transparent px-2 py-1 text-[11px] font-bold text-gray-700 dark:text-slate-200 ${theme.statBorder}`}
                            >
                                {ALARM_LIMITS.map((n) => (
                                    <option
                                        key={n}
                                        value={n}
                                        className="bg-white text-gray-800 dark:bg-slate-800 dark:text-slate-100"
                                    >
                                        Show {n}
                                    </option>
                                ))}
                            </select>
                        </>
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
                                                <p className="break-words text-xs font-bold text-gray-800 dark:text-slate-100">
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

            {/* ── Generation & power trend | Daily energy generation ── */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <Panel
                    theme={theme}
                    title="Generation & power trend"
                    icon="fa-chart-line"
                    action={RANGES.map((item) => (
                        <Tab
                            key={item}
                            theme={theme}
                            active={range === item}
                            onClick={() => setRange(item)}
                        >
                            {item}
                        </Tab>
                    ))}
                >
                    <div className="mb-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-gray-600 dark:text-slate-300">
                        <span className="flex items-center gap-1.5">
                            <i
                                className="inline-block h-0.5 w-4"
                                style={{ backgroundColor: theme.chart }}
                            />
                            AC power (kW)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <i
                                className="inline-block h-0 w-4 border-t-2 border-dashed"
                                style={{
                                    borderColor: theme.chartAlt ?? GEN_COLOR,
                                }}
                            />
                            Generation (kWh)
                        </span>
                    </div>
                    <TrendChart theme={theme} {...trend} />
                </Panel>

                <Panel
                    theme={theme}
                    title={
                        range === "Today"
                            ? "Daily energy generation · Today"
                            : `Daily energy generation · ${range}`
                    }
                    icon="fa-chart-simple"
                >
                    <BarChart theme={theme} data={bars} />
                </Panel>
            </div>

            {/* ── System performance | Communication ── */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Panel
                    theme={theme}
                    title="System performance (last 7 days)"
                    icon="fa-chart-simple"
                >
                    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                        <Kpi
                            theme={theme}
                            icon="fa-bolt"
                            label="Total generation"
                            value={`${fmt(weekTotalKwh, 1)} kWh`}
                            sub={
                                <Delta
                                    value={weekDelta}
                                    label="vs previous 7 days"
                                />
                            }
                            accent={theme.chart}
                        />
                        <Kpi
                            theme={theme}
                            icon="fa-sun"
                            label="Avg. daily generation"
                            value={`${fmt(weekAverage, 1)} kWh`}
                            sub={`Over ${week.length || 0} day(s)`}
                            accent={theme.chart}
                        />
                        <Kpi
                            theme={theme}
                            icon="fa-leaf"
                            label="CO₂ saved"
                            value={`${fmt(en.co2SavedKg, 1)} kg`}
                            accent="#16A34A"
                        />
                        <Kpi
                            theme={theme}
                            icon="fa-tree"
                            label="Equivalent trees"
                            value={fmt(en.equivalentTrees, 1)}
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

            {/* ── System health | Compliance ── */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
                <Panel
                    theme={theme}
                    title="System health"
                    icon="fa-shield-halved"
                >
                    <Health
                        theme={theme}
                        value={health.pct}
                        color={health.color}
                        label={health.label}
                        status={health.status}
                        dataStatus={inv.status}
                        lastDataReceived={inv.lastUpdated}
                    />
                </Panel>

                <Panel theme={theme} title="Compliance" icon="fa-shield-halved">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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

            {/* ── Account details ── */}
            <Panel theme={theme} title="Account details" icon="fa-circle-info">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
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