

# Data Backup/Export — Settings Page

## What It Does

A new "Data Backup" card in Settings that lets users download their entire company data as a single ZIP file containing multiple CSV files — one per entity (Orders, Dealers, Products, Sales Team, Stock, Schemes, Claims, Invoices). One-click, no configuration needed.

## How It Works

1. User clicks **"Download Backup"** button in a new glass-card on the Settings page (placed above the Log Out card)
2. The app queries all company tables from the database
3. Each table is converted to a CSV using the existing `exportCsv` utility pattern (UTF-8 BOM for Excel compatibility)
4. All CSVs are bundled into a ZIP file named `ledge_backup_2026-04-12.zip` using the lightweight `jszip` library (~45KB)
5. ZIP auto-downloads to the user's device

## What's Included in the Backup

| File in ZIP | Source Table |
|-------------|-------------|
| `orders.csv` | orders + order_lines joined |
| `dealers.csv` | distributors |
| `products.csv` | products |
| `sales_team.csv` | salespersons |
| `stock.csv` | stock_items joined with products + godowns |
| `warehouses.csv` | godowns |
| `schemes.csv` | schemes |
| `invoices.csv` | invoices + invoice_lines |
| `claims.csv` | claims + claim_lines |
| `targets.csv` | targets |

## Technical Details

### New dependency
- `jszip` — well-maintained, zero-dependency ZIP library

### Files changed

| File | Change |
|------|--------|
| `src/pages/Settings.tsx` | Add "Data Backup" card with download button + loading state (~40 lines) |
| `src/utils/exportBackup.ts` | New file — async function that queries all tables, builds CSVs, zips them, triggers download (~120 lines) |

### UI Design
- Glass card matching existing Settings cards
- `Database` icon (already imported in Settings) + "Data Backup" heading
- Subtitle: "Download all your company data as a ZIP file"
- Single "Download Backup" button with loading spinner during export
- Success toast with file count on completion

### Security
- All queries go through existing RLS policies — users can only export their own company's data
- No new database changes needed

---

**1 new utility file, 1 modified page, 1 new npm dependency. No database changes. No new features beyond the export.**

