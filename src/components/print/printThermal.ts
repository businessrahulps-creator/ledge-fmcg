import type { Receipt } from "@/lib/thermal-receipt";
import type { ThermalPrefs } from "@/hooks/useThermalPrintPrefs";

const esc = (s: string) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const money = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function receiptHtml(r: Receipt, prefs: ThermalPrefs, paid?: { paid: number; balance: number } | null): string {
  const one = `
  <div class="rc">
    <div class="c b big">${esc(r.sellerName)}</div>
    ${r.sellerAddress ? `<div class="c">${esc(r.sellerAddress)}</div>` : ""}
    ${r.sellerPhone ? `<div class="c">Ph ${esc(r.sellerPhone)}</div>` : ""}
    ${r.sellerGstin ? `<div class="c">GSTIN ${esc(r.sellerGstin)}</div>` : ""}
    <hr/>
    <div class="c b">${esc(r.title)}</div>
    <div class="row"><span>No. ${esc(r.number)}</span><span>${esc(r.date)}</span></div>
    ${r.orderNumber ? `<div>Order ${esc(r.orderNumber)}</div>` : ""}
    <div>To: <b>${esc(r.buyerName)}</b></div>
    ${r.buyerGstin ? `<div>GSTIN ${esc(r.buyerGstin)}</div>` : ""}
    <hr/>
    <table><thead><tr><th class="l">Item</th><th>Qty</th><th>Rate</th><th>Amt</th></tr></thead><tbody>
    ${r.rows.map(x => `<tr><td class="l">${esc(x.name)}</td><td>${x.qty}</td><td>${money(x.rate)}</td><td>${money(x.amount)}</td></tr>`).join("")}
    </tbody></table>
    <hr/>
    ${r.totals.map(t => `<div class="row ${t.bold ? "b big" : ""}"><span>${esc(t.label)}</span><span>${t.bold ? "₹" : ""}${money(t.value)}</span></div>`).join("")}
    ${r.amountInWords ? `<div class="sm">${esc(r.amountInWords)}</div>` : ""}
    ${paid ? `<div class="row"><span>Paid ₹${money(paid.paid)}</span><span class="b">Balance ₹${money(paid.balance)}</span></div>` : ""}
    <hr/>
    ${prefs.showBank && r.bank ? `<div class="sm c">${esc(r.bank)}</div>` : ""}
    ${prefs.footer ? `<div class="c">${esc(prefs.footer)}</div>` : ""}
  </div>`;
  const w = prefs.width;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(r.number)}</title><style>
  @page { size: ${w}mm auto; margin: 0 }
  * { box-sizing: border-box; color: #000 !important; background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact }
  body { margin: 0; width: ${w}mm; font: ${w === 58 ? 10 : 11.5}px/1.35 "Courier New", ui-monospace, monospace }
  .rc { padding: 3mm ${w === 58 ? 2 : 3}mm 6mm; page-break-after: always }
  .rc:last-child { page-break-after: auto }
  .c { text-align: center } .b { font-weight: 700 } .big { font-size: 1.2em } .sm { font-size: .88em }
  hr { border: 0; border-top: 1px dashed #000; margin: 2mm 0 }
  .row { display: flex; justify-content: space-between; gap: 2mm }
  table { width: 100%; border-collapse: collapse } th, td { text-align: right; padding: .3mm 0 .3mm 1.5mm; vertical-align: top; white-space: nowrap } td.l, th.l { white-space: normal; padding-left: 0 }
  .l { text-align: left; word-break: break-word } th { border-bottom: 1px solid #000 }
  </style></head><body>${Array.from({ length: prefs.copies }, () => one).join("")}</body></html>`;
}

/** Prints through a hidden frame so the app itself isn't printed. Call from a click. */
export function printThermal(html: string) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open(); doc.write(html); doc.close();
  const go = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 60_000);
  };
  if (doc.readyState === "complete") setTimeout(go, 50); else frame.onload = go;
}
