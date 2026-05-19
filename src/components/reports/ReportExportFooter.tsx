import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onExcel: () => void;
  onPdf: () => void;
  excelLabel?: string;
  extra?: React.ReactNode;
}

/**
 * Bottom-of-report action bar. Two always-visible buttons (Excel + PDF)
 * operating on the currently filtered dataset. Optional `extra` slot for
 * report-specific exports (e.g. PaymentReport's aging summary).
 */
export function ReportExportFooter({ onExcel, onPdf, excelLabel = "Download Excel", extra }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
      {extra}
      <Button variant="outline" size="sm" className="h-10 px-4" onClick={onExcel}>
        <Download className="h-3.5 w-3.5" />
        <span>{excelLabel}</span>
      </Button>
      <Button variant="outline" size="sm" className="h-10 px-4" onClick={onPdf}>
        <FileText className="h-3.5 w-3.5" />
        <span>Download PDF</span>
      </Button>
    </div>
  );
}
