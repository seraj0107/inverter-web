import { useState } from "react";
import Pagination from "../../../components/ui/Pagination.jsx";
import { usePortalTheme } from "../../theme/hooks/usePortalTheme.js";
import { useHistory } from "../hooks/useHistory.js";
import HistoryList from "../components/HistoryList.jsx";

const LIMIT_OPTIONS = [10, 20, 50];

export default function HistoryPage() {
    const theme = usePortalTheme();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const { records, pagination, loading, error, refresh } = useHistory({
        page,
        limit,
    });

    const totalRecords = Number(pagination.totalRecords) || 0;
    const totalPages = Math.max(Number(pagination.totalPages) || 1, 1);
    const currentPage = Math.min(page, totalPages);
    const from = totalRecords === 0 ? 0 : (currentPage - 1) * limit + 1;
    const to = Math.min(currentPage * limit, totalRecords);

    const handleLimitChange = (event) => {
        setLimit(Number(event.target.value));
        setPage(1);
    };

    return (
        <section
            className={`min-h-full space-y-4 p-4 sm:p-5 lg:p-6 xl:p-8 ${theme.pageBg}`}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <p
                        className={`text-[11px] font-bold uppercase tracking-[0.2em] ${theme.textOnLight}`}
                    >
                        Inverter logs
                    </p>
                    <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                        History
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Detailed inverter telemetry, generation and fault
                        records.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={`rounded-full border px-3 py-2 text-xs font-semibold ${theme.badge}`}
                    >
                        {totalRecords} records
                    </span>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Rows
                        <select
                            value={limit}
                            onChange={handleLimitChange}
                            className={`rounded-lg border bg-white px-2 py-1.5 text-xs outline-none dark:bg-slate-800 ${theme.statBorder} ${theme.focusSelf}`}
                        >
                            {LIMIT_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="button"
                        onClick={refresh}
                        disabled={loading}
                        className={`rounded-full px-4 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60 ${theme.btn}`}
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                    <span>Unable to load history: {error}</span>
                    <button
                        type="button"
                        onClick={refresh}
                        className="font-bold underline underline-offset-2"
                    >
                        Retry
                    </button>
                </div>
            )}

            <HistoryList records={records} loading={loading} theme={theme} />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Showing {from}–{to} of {totalRecords} records
                </p>
                <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    onChange={setPage}
                    disabled={loading}
                />
            </div>
        </section>
    );
}
