/* TallyPrime XML import file builder. Pure functions — no database access —
   so the output can be unit-tested against fixed sample bills.
   Import in TallyPrime: Gateway of Tally > Import > Masters / Transactions. */

export interface TallyLedgers {
  salesPrefix: string;        // "Sales @" -> "Sales @18%"
  salesReturnPrefix: string;  // "Sales Return @"
  purchasePrefix: string;     // "Purchase @"
  outCgst: string; outSgst: string; outIgst: string;
  inCgst: string; inSgst: string; inIgst: string;
  roundOff: string;
  cash: string; bank: string;
  debtorsGroup: string; creditorsGroup: string;
}

export const DEFAULT_LEDGERS: TallyLedgers = {
  salesPrefix: "Sales @", salesReturnPrefix: "Sales Return @", purchasePrefix: "Purchase @",
  outCgst: "Output CGST", outSgst: "Output SGST", outIgst: "Output IGST",
  inCgst: "Input CGST", inSgst: "Input SGST", inIgst: "Input IGST",
  roundOff: "Round Off", cash: "Cash", bank: "Bank Account",
  debtorsGroup: "Sundry Debtors", creditorsGroup: "Sundry Creditors",
};

export const LEDGER_LABELS: Record<keyof TallyLedgers, string> = {
  salesPrefix: "Sales ledger (rate is added, e.g. “Sales @18%”)",
  salesReturnPrefix: "Sales return ledger (rate is added)",
  purchasePrefix: "Purchase ledger (rate is added)",
  outCgst: "CGST on sales", outSgst: "SGST on sales", outIgst: "IGST on sales",
  inCgst: "CGST on purchases", inSgst: "SGST on purchases", inIgst: "IGST on purchases",
  roundOff: "Round off", cash: "Cash", bank: "Bank",
  debtorsGroup: "Group for dealers", creditorsGroup: "Group for suppliers",
};

export interface TaxDoc {
  id: string;
  number: string;
  date: string; // YYYY-MM-DD
  party: string;
  /** Taxable value per GST rate. */
  byRate: { rate: number; taxable: number }[];
  cgst: number; sgst: number; igst: number;
  roundOff: number;
  total: number;
  narration?: string;
}

export interface MoneyDoc {
  id: string;
  date: string;
  party: string;
  amount: number;
  mode: string; // cash | upi | bank_transfer | cheque
  reference?: string;
}

export interface PartyMaster {
  name: string;
  kind: "dealer" | "supplier";
  gstin?: string;
  stateName?: string;
  address?: string;
}

export interface ItemMaster {
  name: string;
  unit: string;
  hsn?: string;
  gstRate?: number | null;
}

export interface TallyInput {
  companyName: string;
  ledgers: TallyLedgers;
  sales?: TaxDoc[];
  creditNotes?: TaxDoc[];
  receipts?: MoneyDoc[];
  purchases?: TaxDoc[];
  supplierPayments?: MoneyDoc[];
  parties?: PartyMaster[];
  items?: ItemMaster[];
}

export const xmlEscape = (s: string) =>
  String(s ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const tdate = (k: string) => k.slice(0, 10).replace(/-/g, "");
const amt = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
const rateName = (prefix: string, r: number) => `${prefix}${Number.isInteger(r) ? r : r.toFixed(2)}%`;

interface Entry { ledger: string; debit: number } // debit > 0, credit < 0

/** Tally: a debit is ISDEEMEDPOSITIVE=Yes with a negative amount. */
function entryXml(e: Entry, isParty: boolean) {
  const dr = e.debit > 0;
  return `<ALLLEDGERENTRIES.LIST><LEDGERNAME>${xmlEscape(e.ledger)}</LEDGERNAME><ISDEEMEDPOSITIVE>${dr ? "Yes" : "No"}</ISDEEMEDPOSITIVE><ISPARTYLEDGER>${isParty ? "Yes" : "No"}</ISPARTYLEDGER><AMOUNT>${amt(dr ? -Math.abs(e.debit) : Math.abs(e.debit))}</AMOUNT></ALLLEDGERENTRIES.LIST>`;
}

function voucherXml(type: string, number: string, date: string, party: string, entries: Entry[], narration = "") {
  const clean = entries.filter(e => Math.abs(e.debit) >= 0.005);
  const partyIdx = clean.findIndex(e => e.ledger === party); // only one entry is the party, even if a ledger shares its name
  return `<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="${type}" ACTION="Create" OBJVIEW="Accounting Voucher View"><DATE>${tdate(date)}</DATE><VOUCHERTYPENAME>${type}</VOUCHERTYPENAME><VOUCHERNUMBER>${xmlEscape(number)}</VOUCHERNUMBER><PARTYLEDGERNAME>${xmlEscape(party)}</PARTYLEDGERNAME><PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW><NARRATION>${xmlEscape(narration)}</NARRATION>${clean.map((e, i) => entryXml(e, i === partyIdx)).join("")}</VOUCHER></TALLYMESSAGE>`;
}

/** Ledger lines for a tax document. sign=+1 means party is debited (sale); -1 means party is credited (purchase). */
export function taxEntries(d: TaxDoc, L: TallyLedgers, kind: "sale" | "credit" | "purchase"): Entry[] {
  const partySide = kind === "sale" ? 1 : -1;               // sale: party Dr; credit note & purchase: party Cr
  const prefix = kind === "sale" ? L.salesPrefix : kind === "credit" ? L.salesReturnPrefix : L.purchasePrefix;
  const taxIn = kind !== "sale";                            // credit note reverses output tax (Dr), purchase is input tax (Dr)
  const tc = kind === "purchase" ? L.inCgst : L.outCgst;
  const ts = kind === "purchase" ? L.inSgst : L.outSgst;
  const ti = kind === "purchase" ? L.inIgst : L.outIgst;
  const s = taxIn ? 1 : -1;                                 // other side sign
  const entries: Entry[] = [{ ledger: d.party, debit: partySide * d.total }];
  for (const b of d.byRate) entries.push({ ledger: rateName(prefix, b.rate), debit: s * b.taxable });
  entries.push({ ledger: tc, debit: s * d.cgst }, { ledger: ts, debit: s * d.sgst }, { ledger: ti, debit: s * d.igst });
  // Whatever is left balances through round off, so every voucher adds up to zero.
  const diff = Math.round(entries.reduce((x, e) => x + e.debit, 0) * 100) / 100;
  if (Math.abs(diff) >= 0.005) entries.push({ ledger: L.roundOff, debit: -diff });
  return entries;
}

const moneyLedger = (mode: string, L: TallyLedgers) => (mode === "cash" ? L.cash : L.bank);

export function buildTallyXml(input: TallyInput): string {
  const L = input.ledgers;
  const msgs: string[] = [];

  for (const p of input.parties ?? []) {
    msgs.push(`<TALLYMESSAGE xmlns:UDF="TallyUDF"><LEDGER NAME="${xmlEscape(p.name)}" ACTION="Create"><NAME.LIST><NAME>${xmlEscape(p.name)}</NAME></NAME.LIST><PARENT>${xmlEscape(p.kind === "dealer" ? L.debtorsGroup : L.creditorsGroup)}</PARENT><ISBILLWISEON>Yes</ISBILLWISEON>${p.address ? `<ADDRESS.LIST><ADDRESS>${xmlEscape(p.address)}</ADDRESS></ADDRESS.LIST>` : ""}${p.stateName ? `<LEDSTATENAME>${xmlEscape(p.stateName)}</LEDSTATENAME>` : ""}<GSTREGISTRATIONTYPE>${p.gstin ? "Regular" : "Unregistered"}</GSTREGISTRATIONTYPE>${p.gstin ? `<PARTYGSTIN>${xmlEscape(p.gstin)}</PARTYGSTIN>` : ""}</LEDGER></TALLYMESSAGE>`);
  }
  for (const it of input.items ?? []) {
    msgs.push(`<TALLYMESSAGE xmlns:UDF="TallyUDF"><STOCKITEM NAME="${xmlEscape(it.name)}" ACTION="Create"><NAME.LIST><NAME>${xmlEscape(it.name)}</NAME></NAME.LIST><BASEUNITS>${xmlEscape(it.unit || "Nos")}</BASEUNITS>${it.hsn ? `<GSTDETAILS.LIST><HSNCODE>${xmlEscape(it.hsn)}</HSNCODE>${it.gstRate != null ? `<STATEWISEDETAILS.LIST><RATEDETAILS.LIST><GSTRATEDUTYHEAD>Integrated Tax</GSTRATEDUTYHEAD><GSTRATE>${it.gstRate}</GSTRATE></RATEDETAILS.LIST></STATEWISEDETAILS.LIST>` : ""}</GSTDETAILS.LIST>` : ""}</STOCKITEM></TALLYMESSAGE>`);
  }
  for (const d of input.sales ?? []) msgs.push(voucherXml("Sales", d.number, d.date, d.party, taxEntries(d, L, "sale"), d.narration));
  for (const d of input.creditNotes ?? []) msgs.push(voucherXml("Credit Note", d.number, d.date, d.party, taxEntries(d, L, "credit"), d.narration));
  for (const d of input.purchases ?? []) msgs.push(voucherXml("Purchase", d.number, d.date, d.party, taxEntries(d, L, "purchase"), d.narration));
  for (const r of input.receipts ?? []) msgs.push(voucherXml("Receipt", "", r.date, r.party, [{ ledger: moneyLedger(r.mode, L), debit: r.amount }, { ledger: r.party, debit: -r.amount }], r.reference ?? ""));
  for (const r of input.supplierPayments ?? []) msgs.push(voucherXml("Payment", "", r.date, r.party, [{ ledger: r.party, debit: r.amount }, { ledger: moneyLedger(r.mode, L), debit: -r.amount }], r.reference ?? ""));

  return `<?xml version="1.0" encoding="UTF-8"?>\n<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>All Masters</REPORTNAME><STATICVARIABLES><SVCURRENTCOMPANY>${xmlEscape(input.companyName)}</SVCURRENTCOMPANY></STATICVARIABLES></REQUESTDESC><REQUESTDATA>${msgs.join("")}</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>\n`;
}

/** Plain-language problems to show before exporting. */
export function tallyWarnings(input: TallyInput): string[] {
  const w: string[] = [];
  const noGst = (input.parties ?? []).filter(p => p.kind === "dealer" && !p.gstin).length;
  if (noGst) w.push(`${noGst} dealer${noGst === 1 ? " has" : "s have"} no GSTIN — they'll go in as unregistered.`);
  const noHsn = (input.items ?? []).filter(i => !i.hsn).length;
  if (noHsn) w.push(`${noHsn} product${noHsn === 1 ? " has" : "s have"} no HSN code.`);
  const noRate = (input.items ?? []).filter(i => i.gstRate == null).length;
  if (noRate) w.push(`${noRate} product${noRate === 1 ? " has" : "s have"} no GST rate set.`);
  return w;
}

/** Indian state names by GST state code, for party masters. */
export const STATE_BY_CODE: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana",
  "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland",
  "14": "Manipur", "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
  "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat", "26": "Dadra & Nagar Haveli and Daman & Diu",
  "27": "Maharashtra", "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry",
  "35": "Andaman & Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh",
};
