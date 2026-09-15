import React from "react";
import { renderToFile } from "@react-pdf/renderer";
import { PerformanceReportPdf } from "@/components/pdf/PerformanceReportPdf";
const data = {
  summary: [
    { label: "Revenue", value: "₹1,24,50,000" }, { label: "Orders", value: "820" },
    { label: "Collected", value: "₹18,40,000" }, { label: "Dealers", value: "110" },
    { label: "Avg order", value: "₹15,183" }, { label: "Outstanding", value: "₹1,66,02,528" },
  ],
  revenueTrend: Array.from({length: 12}, (_,i)=>({ date: `Week ${i+1}`, revenue: 100000*(i+1) })),
  paymentSplit: [ { name: "Paid", value: 120, status: "paid" }, { name: "Partial", value: 30, status: "partial" }, { name: "Pending", value: 670, status: "pending" } ],
  topDealers: Array.from({length: 10}, (_,i)=>({ name: `Thiruvananthapuram Beverages Depot ${i+1}`, revenue: 500000-40000*i })),
  productVelocity: Array.from({length: 10}, (_,i)=>({ name: `AquaPure Packaged Water 1L variant ${i+1}`, qty: 900-50*i })),
  salesRanking: Array.from({length: 10}, (_,i)=>({ name: `Salesperson ${i+1}`, revenue: 1800000-90000*i })),
};
await renderToFile(
  <PerformanceReportPdf title="Performance Report" subtitle="Last 30 days" companyName="Asha Beverages Distributors" companyAddress="42/1, Industrial Estate, Kalamassery, Ernakulam, Kerala 683109" gstin="32AABCA1234F1ZP" show={{company:true,summary:true,revenueTrend:true,paymentSplit:true,dealers:true,products:true,salesTeam:true}} data={data} />,
  "/tmp/pdftest/perf.pdf",
);
console.log("ok");
