import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <FileText className="h-4 w-4" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
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
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={!anySelected || loading}>
            {loading ? "Generating…" : "Generate PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
