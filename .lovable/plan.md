

# Roll Out Light Premium Design — Full Platform

## Design System (from approved /preview)

- **Background**: `#FAFAFA`, **Cards**: `bg-white border-[#EBEBEB] shadow-sm rounded-2xl`
- **Text**: `#111` primary, `#333` secondary, `#888`/`#999` muted
- **Status badges**: Soft tones (`bg-emerald-50 text-emerald-600`, `bg-amber-50 text-amber-600`, `bg-red-50 text-red-500`)
- **Icons**: Modern Lucide (`House`, `Receipt`, `Box`, `UserRound`, `ChartNoAxesCombined`), 18px, strokeWidth 1.8
- **Mobile nav**: Floating pill with animated active state
- **Desktop**: Sidebar with updated icons, content max-width `5xl`

## Files Changed (22 files)

### Foundation (3 files)
| File | Change |
|---|---|
| `src/index.css` | Update CSS vars: background → #FAFAFA, card → white, border → #EBEBEB, foreground → #111 |
| `src/components/ui/status-badge.tsx` | Replace `status-*` classes with soft-color inline styles |
| `src/App.tsx` | Remove `/preview` route |

### Layout Shell (2 files)
| File | Change |
|---|---|
| `src/components/layout/AppLayout.tsx` | bg-[#FAFAFA], floating pill nav with modern icons + framer-motion, lighter header, responsive container |
| `src/components/layout/AppSidebar.tsx` | Swap to modern icons, white bg, updated border colors |

### Pages (13 files)
| File | Change |
|---|---|
| `src/pages/Dashboard.tsx` | Greeting header, day indicator, preview-style KPI cards, grayscale progress bars, order cards |
| `src/pages/Orders.tsx` | White cards, updated borders/colors, status badges |
| `src/pages/NewOrder.tsx` | Card styling, form inputs |
| `src/pages/Distributors.tsx` | Card grid + dialog styling |
| `src/pages/Products.tsx` | Table/card borders |
| `src/pages/Salespersons.tsx` | Card grid + profile dialog |
| `src/pages/Reports.tsx` | Tab styling |
| `src/pages/GodownOverview.tsx` | KPI from dark glass → white cards, location cards |
| `src/pages/GodownInventory.tsx` | Table/card/filter styling |
| `src/pages/GodownAlerts.tsx` | Alert card styling |
| `src/pages/Settings.tsx` | Tabs, team list, subscription |
| `src/pages/Login.tsx` | Background + card |
| `src/pages/Signup.tsx` | Background + card |

### Report Components (4 files)
| File | Change |
|---|---|
| `DistributorReport.tsx` | Table/card colors |
| `ProductReport.tsx` | Table/card colors |
| `PaymentReport.tsx` | Table/card colors |
| `DispatchReport.tsx` | Table/card colors |

### Godown Components (2 files)
| File | Change |
|---|---|
| `StockDetailPanel.tsx` | Panel bg/border |
| `TransferStockModal.tsx` | Modal bg/border |

### Cleanup (1 file)
| File | Change |
|---|---|
| `src/pages/PreviewDashboard.tsx` | Delete — design absorbed into main pages |

## What Won't Change
- Landing page (`/`) — keeps its dark theme
- Core UI primitives (button, input, dialog) — pick up new CSS vars automatically
- Data layer, routing logic, business logic

