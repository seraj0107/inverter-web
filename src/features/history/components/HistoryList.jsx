import { useCallback, useMemo, useRef, useState } from 'react'
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { THEMES } from '../../theme/constants/theme.js'
import { useTheme } from '../../theme/hooks/useTheme.js'

ModuleRegistry.registerModules([AllCommunityModule])

const HISTORY_COLUMNS = [
  ['DATE', 'DATE'],
  ['RSSI', 'SIGNAL STRENGTH'],
  ['PV1VOLT', 'PV1VOLT'],
  ['PV1CURRENT', 'PV1CURRENT'],
  ['PVPOWER', 'PVPOWER'],
  ['GRIDVOLTAGE', 'GRIDVOLTAGE'],
  ['GRIDCURRENT', 'GRIDCURRENT'],
  ['GRIDFREQUENCY', 'GRIDFREQUENCY'],
  ['TOTALENERGY_F32', 'TOTALENERGY_F32'],
  ['PVENERGY_F32', 'PVENERGY_F32'],
  ['ACTIVEPOWER', 'ACTIVEPOWER'],
  ['APPARENTPOWER', 'APPARENTPOWER'],
  ['POWERFACTOR', 'POWERFACTOR'],
  ['FAULTSTATUS', 'FAULTSTATUS'],
  ['INVERTERSTATE', 'INVERTERSTATE'],
  ['WARNINGCODE', 'WARNINGCODE'],
  ['SAFETYTYPE', 'SAFETYTYPE'],
  ['STINTERVAL', 'STINTERVAL'],
  ['DAILYMAXPOWER', 'DAILYMAXPOWER'],
  ['INVERTERTEMP', 'INVERTERTEMP'],
  ['INVSTATE', 'INVSTATE'],
  ['FAULT', 'FAULT'],
  ['FAULTINFO1', 'FAULTINFO1'],
  ['FAULTINFO2', 'FAULTINFO2'],
  ['FAULTINFO3', 'FAULTINFO3'],
  ['FAULTINFO4', 'FAULTINFO4'],
  ['DEVICEMODEL', 'DEVICEMODEL'],
  ['RUNNING_TIME', 'RUNNING_TIME'],
  ['PV2VOLT', 'PV2VOLT'],
  ['PV2CURRENT', 'PV2CURRENT'],
  ['PV2POWER', 'PV2POWER'],
  ['PLANTID', 'PLANTID'],
  ['PLANTNAME', 'PLANTNAME'],
  ['COLLECTORADDRESS', 'COLLECTORADDRESS'],
  ['CAPACITYKWP', 'CAPACITYKWP'],
  ['MONTHENERGY', 'MONTHENERGY'],
  ['YEARENERGY', 'YEARENERGY'],
  ['YESTERDAYENERGY', 'YESTERDAYENERGY'],
  ['LAST7DAYSENERGY', 'LAST7DAYSENERGY'],
  ['PREVIOUS7DAYSENERGY', 'PREVIOUS7DAYSENERGY'],
  ['CO2SAVEDKG', 'CO2SAVEDKG'],
  ['EQUIVALENTTREES', 'EQUIVALENTTREES'],
  ['LIFETIMERUNNINGHRS', 'LIFETIMERUNNINGHRS'],
  ['KEEPLIVE', 'KEEPLIVE'],
  ['SOURCE', 'SOURCE'],
]

function getColumnWidth(field) {
  if (field === 'FAULT') return 290
  if (field === 'DATE') return 140
  if (field === 'PLANTNAME' || field === 'DEVICEMODEL') return 170
  if (field === 'INVERTERSTATE' || field === 'INVSTATE') return 170
  return 135
}

function getStateClasses(value) {
  const state = value.toUpperCase()

  if (state === 'RUNNING') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
  }
  if (state === 'FAULT') {
    return 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
  }
  if (state === 'STANDBY') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
  }
  return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
}

function HistoryCell({ value, colDef, data }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400 dark:text-slate-500">—</span>
  }

  const field = colDef.field
  const text = String(value)

  if (field === 'DATE') {
    return (
      <span className="font-semibold text-slate-800 dark:text-slate-100" title={data?.TIMESTAMP ?? ''}>
        {text}
      </span>
    )
  }

  if (field === 'INVERTERSTATE' || field === 'INVSTATE') {
    return (
      <span className="flex h-full items-center">
        <span className={`inline-flex h-6 shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-2.5 text-[10px] font-bold uppercase leading-none tracking-wide ${getStateClasses(text)}`}>
          {text}
        </span>
      </span>
    )
  }

  if (field === 'FAULT') {
    return <span className="font-medium text-red-600 dark:text-red-400">{text}</span>
  }

  if (field === 'FAULTSTATUS' && text === '1') {
    return <span className="font-semibold text-red-600 dark:text-red-400">{text}</span>
  }

  return <span className="text-slate-700 dark:text-slate-200">{text}</span>
}

const COLUMN_DEFS = HISTORY_COLUMNS.map(([field, headerName]) => {
  const width = getColumnWidth(field)

  return {
    field,
    headerName,
    headerTooltip: headerName,
    width,
    minWidth: width,
    pinned: field === 'DATE' ? 'left' : undefined,
    cellRenderer: HistoryCell,
    tooltipValueGetter: ({ value, data }) => {
      if (value === null || value === undefined || value === '') return ''
      return field === 'DATE' && data?.TIMESTAMP ? String(data.TIMESTAMP) : String(value)
    },
  }
})

const DEFAULT_COL_DEF = {
  sortable: true,
  resizable: true,
  filter: true,
  filterParams: { buttons: ['reset', 'apply'] },
  suppressMovable: false,
}

function getRowId({ data, node }) {
  return data?.id ?? `${data?.DATE ?? 'row'}-${data?.TIMESTAMP ?? ''}-${node?.rowIndex ?? ''}`
}

function createGridTheme(accentColor, isDark) {
  const isGold = String(accentColor).toUpperCase() === '#F5B800'

  return themeQuartz.withParams({
    accentColor,
    backgroundColor: isDark ? (isGold ? '#171611' : '#171313') : '#FFFFFF',
    foregroundColor: isDark ? '#F8FAFC' : '#0F172A',
    borderColor: isDark ? (isGold ? '#3B3524' : '#3B2525') : '#E2E8F0',
    chromeBackgroundColor: isDark
      ? isGold
        ? '#1D1B14'
        : '#1D1717'
      : isGold
        ? '#FFF9E8'
        : '#FFF7F7',
    headerBackgroundColor: isDark
      ? isGold
        ? '#1D1B14'
        : '#1D1717'
      : isGold
        ? '#FFF4D6'
        : '#FEF2F2',
    headerTextColor: isDark ? '#FCD34D' : isGold ? '#92400E' : '#991B1B',
    oddRowBackgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.02)',
    rowHoverColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
    selectedRowBackgroundColor: isDark ? 'rgba(245,184,0,0.16)' : 'rgba(220,38,38,0.10)',
    browserColorScheme: isDark ? 'dark' : 'light',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontSize: 12,
    headerFontSize: 11,
    headerFontWeight: 700,
    headerHeight: 40,
    rowHeight: 38,
    cellHorizontalPadding: 12,
    borderRadius: 8,
    wrapperBorderRadius: 12,
  })
}

export default function HistoryList({ records = [], loading = false, theme = {} }) {
  const gridRef = useRef(null)
  const [quickFilterText, setQuickFilterText] = useState('')
  const { theme: colorMode } = useTheme()
  const isDark = colorMode === THEMES.dark
  const accentColor = theme.chart || '#DC2626'
  const gridTheme = useMemo(
    () => createGridTheme(accentColor, isDark),
    [accentColor, isDark],
  )

  const clearFilters = useCallback(() => {
    setQuickFilterText('')
    gridRef.current?.api.setFilterModel(null)
  }, [])

  const exportCsv = useCallback(() => {
    gridRef.current?.api.exportDataAsCsv({ fileName: 'inverter-history.csv' })
  }, [])

  const getRowStyle = useCallback(
    ({ data }) => {
      if (String(data?.INVERTERSTATE ?? '').toUpperCase() === 'FAULT') {
        return {
          backgroundColor: isDark ? 'rgba(220,38,38,0.08)' : 'rgba(220,38,38,0.035)',
        }
      }
      return undefined
    },
    [isDark],
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={quickFilterText}
            onChange={(event) => setQuickFilterText(event.target.value)}
            placeholder="Search all columns…"
            className={`w-full rounded-lg border bg-white px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 dark:bg-slate-800 dark:text-slate-200 sm:w-72 ${theme.statBorder ?? 'border-slate-200 dark:border-slate-700'} ${theme.focusSelf ?? 'focus:border-slate-400'}`}
          />
          <button
            type="button"
            onClick={clearFilters}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 ${theme.statBorder ?? 'border-slate-200 dark:border-slate-700'} ${theme.statBg ?? 'bg-white dark:bg-slate-800'}`}
          >
            Clear filters
          </button>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className={`rounded-full px-4 py-2 text-xs font-bold ${theme.btn}`}
        >
          Export CSV
        </button>
      </div>

      <div
        className={`h-[calc(100dvh-330px)] min-h-96 w-full overflow-hidden rounded-xl border ${theme.statBorder ?? 'border-slate-200 dark:border-slate-700'}`}
      >
        <AgGridReact
          ref={gridRef}
          theme={gridTheme}
          rowData={records}
          columnDefs={COLUMN_DEFS}
          defaultColDef={DEFAULT_COL_DEF}
          loading={loading}
          quickFilterText={quickFilterText}
          getRowId={getRowId}
          getRowStyle={getRowStyle}
          animateRows
          enableCellTextSelection
          suppressDragLeaveHidesColumns
          tooltipShowDelay={150}
          overlayLoadingTemplate='<span style="padding: 24px; color: #64748b; font-size: 12px;">Loading history…</span>'
          overlayNoRowsTemplate='<span style="padding: 24px; color: #64748b; font-size: 12px;">No history records available</span>'
          className="h-full w-full"
        />
      </div>
    </div>
  )
}
