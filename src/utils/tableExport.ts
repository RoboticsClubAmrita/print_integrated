/**
 * Table export — the same column definition drives both download formats.
 *
 * CSV is the interchange format; XLSX is a genuine OOXML workbook (frozen and
 * filtered header row, real numeric cells for money) assembled here rather than
 * pulled from a spreadsheet library, so exporting costs the bundle nothing but
 * this file and `zip.ts`.
 */

import { createZip, type ZipEntry } from './zip';

export type ExportValue = string | number | null | undefined;

export type ExportColumn<T> = {
    header: string;
    value: (row: T) => ExportValue;
    /** Excel column width in characters. Ignored by CSV. */
    width?: number;
    /** Write as a 2-decimal numeric cell in Excel instead of text. */
    money?: boolean;
};

/* ————— shared ————— */

const cellText = (value: ExportValue): string =>
    value === null || value === undefined ? '' : String(value);

function saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Firefox needs the object URL to outlive the click handler.
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** `report` + today → `report-2026-08-08`. Safe for every filesystem. */
export function stampedName(base: string): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    return `${base.replace(/[^\w-]+/g, '-').toLowerCase()}-${date}`;
}

/* ————— CSV ————— */

const NEEDS_QUOTING = /[",\n\r]/;

const csvCell = (value: ExportValue): string => {
    const text = cellText(value);
    return NEEDS_QUOTING.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function downloadCsv<T>(
    filename: string,
    columns: readonly ExportColumn<T>[],
    rows: readonly T[],
): void {
    const lines = [
        columns.map((c) => csvCell(c.header)).join(','),
        ...rows.map((row) => columns.map((c) => csvCell(c.value(row))).join(',')),
    ];
    // BOM so Excel opens the UTF-8 (₹, accented names) correctly on Windows.
    const blob = new Blob(['\ufeff', lines.join('\r\n')], {
        type: 'text/csv;charset=utf-8',
    });
    saveBlob(blob, `${filename}.csv`);
}

/* ————— XLSX ————— */

const XML_ESCAPES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
};

/** Escape for XML text, dropping the control characters XML 1.0 forbids. */
const xml = (value: string): string =>
    value
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        .replace(/[&<>"']/g, (c) => XML_ESCAPES[c]);

/** 0 → A, 25 → Z, 26 → AA. */
function columnLetter(index: number): string {
    let n = index + 1;
    let name = '';
    while (n > 0) {
        const remainder = (n - 1) % 26;
        name = String.fromCharCode(65 + remainder) + name;
        n = Math.floor((n - 1) / 26);
    }
    return name;
}

/** Indices into `cellXfs` in the styles part below. */
const STYLE_BODY = 0;
const STYLE_HEADER = 1;
const STYLE_MONEY = 2;

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_PKG_REL = 'http://schemas.openxmlformats.org/package/2006/relationships';

/** Excel rejects these in a sheet name, and caps it at 31 characters. */
const sheetTitle = (name: string) => name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Sheet1';

function buildCell<T>(
    column: ExportColumn<T>,
    row: T,
    ref: string,
): string {
    const raw = column.value(row);

    if (typeof raw === 'number' && Number.isFinite(raw)) {
        const style = column.money ? STYLE_MONEY : STYLE_BODY;
        return `<c r="${ref}" s="${style}"><v>${raw}</v></c>`;
    }

    const text = cellText(raw);
    if (!text) return `<c r="${ref}" s="${STYLE_BODY}"/>`;
    // xml:space keeps leading/trailing spaces Excel would otherwise trim.
    return `<c r="${ref}" s="${STYLE_BODY}" t="inlineStr"><is><t xml:space="preserve">${xml(text)}</t></is></c>`;
}

function buildSheet<T>(columns: readonly ExportColumn<T>[], rows: readonly T[]): string {
    const lastColumn = columnLetter(columns.length - 1);
    const lastRow = rows.length + 1;
    const span = `A1:${lastColumn}${lastRow}`;

    const cols = columns
        .map((c, i) => {
            const width = c.width ?? Math.max(12, c.header.length + 4);
            return `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`;
        })
        .join('');

    const headerRow =
        `<row r="1" ht="20" customHeight="1">` +
        columns
            .map(
                (c, i) =>
                    `<c r="${columnLetter(i)}1" s="${STYLE_HEADER}" t="inlineStr"><is><t>${xml(c.header)}</t></is></c>`,
            )
            .join('') +
        `</row>`;

    const bodyRows = rows
        .map((row, r) => {
            const number = r + 2; // row 1 is the header
            const cells = columns
                .map((c, i) => buildCell(c, row, `${columnLetter(i)}${number}`))
                .join('');
            return `<row r="${number}">${cells}</row>`;
        })
        .join('');

    return (
        `${XML_DECL}<worksheet xmlns="${NS_MAIN}">` +
        `<dimension ref="${span}"/>` +
        `<sheetViews><sheetView workbookViewId="0">` +
        `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>` +
        `</sheetView></sheetViews>` +
        `<sheetFormatPr defaultRowHeight="15"/>` +
        `<cols>${cols}</cols>` +
        `<sheetData>${headerRow}${bodyRows}</sheetData>` +
        `<autoFilter ref="${span}"/>` +
        `</worksheet>`
    );
}

/** numFmtId 4 is the built-in `#,##0.00`. */
const STYLES_XML =
    `${XML_DECL}<styleSheet xmlns="${NS_MAIN}">` +
    `<fonts count="2">` +
    `<font><sz val="11"/><name val="Calibri"/></font>` +
    `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>` +
    `</fonts>` +
    `<fills count="3">` +
    `<fill><patternFill patternType="none"/></fill>` +
    `<fill><patternFill patternType="gray125"/></fill>` +
    `<fill><patternFill patternType="solid"><fgColor rgb="FF1F2430"/><bgColor indexed="64"/></patternFill></fill>` +
    `</fills>` +
    `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="3">` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
    `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>` +
    `<xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
    `</cellXfs>` +
    // Readers warn about a workbook with no named default style.
    `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
    `<dxfs count="0"/>` +
    `</styleSheet>`;

const CONTENT_TYPES_XML =
    `${XML_DECL}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    `</Types>`;

const ROOT_RELS_XML =
    `${XML_DECL}<Relationships xmlns="${NS_PKG_REL}">` +
    `<Relationship Id="rId1" Type="${NS_REL}/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

const WORKBOOK_RELS_XML =
    `${XML_DECL}<Relationships xmlns="${NS_PKG_REL}">` +
    `<Relationship Id="rId1" Type="${NS_REL}/worksheet" Target="worksheets/sheet1.xml"/>` +
    `<Relationship Id="rId2" Type="${NS_REL}/styles" Target="styles.xml"/>` +
    `</Relationships>`;

const workbookXml = (sheetName: string) =>
    `${XML_DECL}<workbook xmlns="${NS_MAIN}" xmlns:r="${NS_REL}">` +
    `<sheets><sheet name="${xml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>` +
    `</workbook>`;

const XLSX_MIME =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export function downloadXlsx<T>(
    filename: string,
    sheetName: string,
    columns: readonly ExportColumn<T>[],
    rows: readonly T[],
): void {
    const title = sheetTitle(sheetName);
    const parts: ZipEntry[] = [
        { path: '[Content_Types].xml', data: CONTENT_TYPES_XML },
        { path: '_rels/.rels', data: ROOT_RELS_XML },
        { path: 'xl/workbook.xml', data: workbookXml(title) },
        { path: 'xl/_rels/workbook.xml.rels', data: WORKBOOK_RELS_XML },
        { path: 'xl/styles.xml', data: STYLES_XML },
        { path: 'xl/worksheets/sheet1.xml', data: buildSheet(columns, rows) },
    ];

    const zip = createZip(parts);
    saveBlob(new Blob([zip], { type: XLSX_MIME }), `${filename}.xlsx`);
}
