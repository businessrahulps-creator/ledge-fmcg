import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export interface PdfSection {
  id: string;
  label: string;
  defaultChecked?: boolean;
}

interface ExportPdfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  sections: PdfSection[];
  onGenerate: (selected: Record<string, boolean>) => void | Promise<void>;
}

export function ExportPdfModal({
  open,
  onOpenChange,
  title = "Export PDF",
  sections,
  onGenerate,
}: ExportPdfModalProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((s) => [s.id, s.defaultChecked !== false]))
  );
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await onGenerate(selected);
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  };

  const anySelected = Object.values(selected).some(Boolean);

  return (
    <Dialog open={open} onOpenChange={loading ? () => {} : onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <FileText className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">Choose sections to include in the PDF export</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">
                Generating your PDF…
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Choose what to include in the PDF:
              </p>
              {sections.map((section) => (
                <div key={section.id} className="flex items-center gap-3">
                  <Checkbox
                    id={section.id}
                    checked={selected[section.id]}
                    onCheckedChange={() => toggle(section.id)}
                  />
                  <Label htmlFor={section.id} className="text-sm cursor-pointer">
                    {section.label}
                  </Label>
                </div>
              ))}
            </>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          {!loading && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          <Button onClick={handleGenerate} disabled={!anySelected || loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Generating…
              </>
            ) : (
              "Generate PDF"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}