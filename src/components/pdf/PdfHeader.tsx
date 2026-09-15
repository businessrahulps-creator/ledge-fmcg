import { View, Text, Image } from "@react-pdf/renderer";
import { pdfStyles as s } from "./PdfStyles";

interface PdfHeaderProps {
  companyName?: string;
  companyAddress?: string;
  gstin?: string;
  logoUrl?: string;
  title: string;
  subtitle?: string;
  showCompany?: boolean;
  /** Repeat the letterhead at the top of every page of a flowing document. */
  fixed?: boolean;
}

export function PdfHeader({
  companyName = "Your Company",
  companyAddress = "",
  gstin = "",
  logoUrl = "",
  title,
  subtitle,
  showCompany = true,
  fixed = false,
}: PdfHeaderProps) {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
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
    <View style={s.headerRow} fixed={fixed}>
      <View style={s.headerLeft}>
        {showCompany && logoUrl ? (
          <Image src={logoUrl} style={{ width: 36, height: 36, objectFit: "contain" }} />
        ) : null}
        <View style={{ flex: 1 }}>
          {showCompany && <Text style={s.companyName}>{companyName}</Text>}
          {showCompany && companyAddress ? <Text style={s.companyDetail}>{companyAddress}</Text> : null}
          {showCompany && gstin ? <Text style={s.companyDetail}>GSTIN: {gstin}</Text> : null}
        </View>
      </View>
      <View style={s.headerRight}>
        <Text style={s.docTitle}>{title}</Text>
        {subtitle && <Text style={s.docSubtitle}>{subtitle}</Text>}
        <Text style={s.docSubtitle}>Generated {dateStr}, {timeStr}</Text>
      </View>
    </View>
  );
}
