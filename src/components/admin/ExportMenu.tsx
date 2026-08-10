import { ChevronDown, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { downloadCsv, downloadXlsx, type ExportColumn } from '../../utils/tableExport';
import { useDismissable } from './useDismissable';

/**
 * The download control for a Press Room register. One quiet button opens a
 * short list of formats rather than lining two buttons up in the header —
 * downloading is one intent, the file type is a detail of it.
 */
export function ExportMenu<T>({
    columns,
    rows,
    filename,
    sheetName,
    disabled,
}: {
    columns: readonly ExportColumn<T>[];
    rows: readonly T[];
    /** Base name, no extension. */
    filename: string;
    /** Worksheet tab label in the .xlsx. */
    sheetName: string;
    disabled?: boolean;
}) {
    const { ref, open, setOpen } = useDismissable();

    const empty = rows.length === 0;
    const isDisabled = disabled || empty;

    const run = (format: 'csv' | 'xlsx') => {
        setOpen(false);
        if (format === 'xlsx') downloadXlsx(filename, sheetName, columns, rows);
        else downloadCsv(filename, columns, rows);
    };

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                disabled={isDisabled}
                aria-haspopup="menu"
                aria-expanded={open}
                title={empty ? 'Nothing to export' : `Download ${rows.length} rows`}
                className="btn-ghost"
            >
                <Download size={15} />
                Export
                <ChevronDown
                    size={13}
                    className={`-mr-1 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div
                    role="menu"
                    className="dialog absolute right-0 top-[calc(100%+8px)] z-30 w-[236px] origin-top-right overflow-hidden !rounded-[16px] p-1.5"
                >
                    <MenuItem
                        icon={FileSpreadsheet}
                        label="Excel workbook"
                        hint=".xlsx · formatted columns"
                        onClick={() => run('xlsx')}
                    />
                    <MenuItem
                        icon={FileText}
                        label="Comma-separated"
                        hint=".csv · plain text"
                        onClick={() => run('csv')}
                    />
                    <p className="receipt-line px-3 pb-1.5 pt-2 !text-[10.5px]">
                        {rows.length} ROW{rows.length === 1 ? '' : 'S'} · CURRENT FILTERS
                    </p>
                </div>
            )}
        </div>
    );
}

function MenuItem({
    icon: Icon,
    label,
    hint,
    onClick,
}: {
    icon: typeof FileText;
    label: string;
    hint: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            role="menuitem"
            onClick={onClick}
            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors duration-150 hover:bg-white/7 focus-visible:bg-white/7 focus-visible:outline-none"
        >
            <Icon size={16} className="shrink-0 text-text-muted" />
            <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-text">{label}</span>
                <span className="block text-[11.5px] text-text-muted">{hint}</span>
            </span>
        </button>
    );
}

export default ExportMenu;
