/**
 * A minimal STORE-only ZIP writer.
 *
 * An .xlsx file is just a ZIP of XML parts, so the only thing standing between
 * us and a real Excel workbook is an archive container. Writing every entry
 * uncompressed (method 0) keeps that container down to a CRC table and two
 * fixed-layout headers — no compression library, no new dependency. Spreadsheet
 * XML for an admin table is a few dozen KB at most, so the size we give up by
 * skipping deflate never shows.
 */

export type ZipEntry = {
    /** Path inside the archive, e.g. `xl/worksheets/sheet1.xml`. */
    path: string;
    /** UTF-8 text content. */
    data: string;
};

const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_EOCD = 0x06054b50;

const LOCAL_HEADER_SIZE = 30;
const CENTRAL_HEADER_SIZE = 46;
const EOCD_SIZE = 22;

const VERSION = 20; // 2.0 — all we need for stored entries
const FLAG_UTF8_NAMES = 0x0800;
const METHOD_STORE = 0;

/**
 * Fixed DOS timestamp (1980-01-01 00:00). The archive carries no meaningful
 * mtime, and pinning it means the same table always exports byte-identical.
 */
const DOS_TIME = 0;
const DOS_DATE = 0x21;

const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let bit = 0; bit < 8; bit++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[i] = c >>> 0;
    }
    return table;
})();

function crc32(bytes: Uint8Array): number {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
        c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
}

/** Assemble the entries into a ZIP archive. */
export function createZip(entries: readonly ZipEntry[]): Blob {
    const encoder = new TextEncoder();
    // Explicit backing-buffer type: a plain `Uint8Array[]` widens to
    // ArrayBufferLike, which `Blob` will not accept as a BlobPart.
    const body: Uint8Array<ArrayBuffer>[] = [];
    const directory: Uint8Array<ArrayBuffer>[] = [];
    let offset = 0;

    for (const entry of entries) {
        const name = encoder.encode(entry.path);
        const data = encoder.encode(entry.data);
        const crc = crc32(data);

        const local = new Uint8Array(LOCAL_HEADER_SIZE + name.length);
        const lv = new DataView(local.buffer);
        lv.setUint32(0, SIG_LOCAL, true);
        lv.setUint16(4, VERSION, true);
        lv.setUint16(6, FLAG_UTF8_NAMES, true);
        lv.setUint16(8, METHOD_STORE, true);
        lv.setUint16(10, DOS_TIME, true);
        lv.setUint16(12, DOS_DATE, true);
        lv.setUint32(14, crc, true);
        lv.setUint32(18, data.length, true); // compressed == uncompressed
        lv.setUint32(22, data.length, true);
        lv.setUint16(26, name.length, true);
        lv.setUint16(28, 0, true); // no extra field
        local.set(name, LOCAL_HEADER_SIZE);

        const central = new Uint8Array(CENTRAL_HEADER_SIZE + name.length);
        const cv = new DataView(central.buffer);
        cv.setUint32(0, SIG_CENTRAL, true);
        cv.setUint16(4, VERSION, true); // version made by
        cv.setUint16(6, VERSION, true); // version needed
        cv.setUint16(8, FLAG_UTF8_NAMES, true);
        cv.setUint16(10, METHOD_STORE, true);
        cv.setUint16(12, DOS_TIME, true);
        cv.setUint16(14, DOS_DATE, true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, data.length, true);
        cv.setUint32(24, data.length, true);
        cv.setUint16(28, name.length, true);
        // extra len / comment len / disk / internal attrs stay zero
        cv.setUint32(38, 0, true); // external attrs
        cv.setUint32(42, offset, true);
        central.set(name, CENTRAL_HEADER_SIZE);

        body.push(local, data);
        directory.push(central);
        offset += local.length + data.length;
    }

    const directorySize = directory.reduce((sum, part) => sum + part.length, 0);

    const eocd = new Uint8Array(EOCD_SIZE);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, SIG_EOCD, true);
    ev.setUint16(8, entries.length, true); // entries on this disk
    ev.setUint16(10, entries.length, true); // entries total
    ev.setUint32(12, directorySize, true);
    ev.setUint32(16, offset, true); // central directory offset

    return new Blob([...body, ...directory, eocd], { type: 'application/zip' });
}
