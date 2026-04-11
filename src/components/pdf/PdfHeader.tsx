import { View, Text } from "@react-pdf/renderer";
import { pdfStyles as s } from "./PdfStyles";

interface PdfHeaderProps {
  companyName?: string;
  companyAddress?: string;
  gstin?: string;
  title: string;
  subtitle?: string;
  showCompany?: boolean;
}

export function PdfHeader({
  companyName = "Your Company",
  companyAddress = "",
  gstin = "",
  title,
  subtitle,
  showCompany = true,
}: PdfHeaderProps) {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(now);
  const timeStr = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(now);

  return (
    <View style={s.headerRow}>
      <View>
        {showCompany && <Text style={s.companyName}>{companyName}</Text>}
        {showCompany && companyAddress ? <Text style={s.companyDetail}>{companyAddress}</Text> : null}
        {showCompany && gstin ? <Text style={s.companyDetail}>GSTIN: {gstin}</Text> : null}
      </View>
      <View>
        <Text style={s.docTitle}>{title}</Text>
        {subtitle && <Text style={s.docSubtitle}>{subtitle}</Text>}
        <Text style={s.docSubtitle}>Generated: {dateStr} {timeStr}</Text>
      </View>
    </View>
  );
}
