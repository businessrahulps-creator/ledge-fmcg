import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { godownLocations, stockItems, type StockItem } from "@/data/godown-data";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  item: StockItem;
  onClose: () => void;
}

export function TransferStockModal({ item, onClose }: Props) {
  const { toast } = useToast();
  const [fromGodown, setFromGodown] = useState(item.godownId);
  const [toGodown, setToGodown] = useState("");
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [transferDate, setTransferDate] = useState(today);

  const sourceStock = stockItems.find(si => si.productId === item.productId && si.godownId === fromGodown);
  const maxQty = sourceStock?.quantity || 0;
  const qty = parseInt(quantity) || 0;
  const isOverLimit = qty > maxQty;
  const isValid = fromGodown && toGodown && fromGodown !== toGodown && qty > 0 && !isOverLimit;

  const fromGodownName = godownLocations.find(g => g.id === fromGodown)?.name || "";
  const toGodownName = godownLocations.find(g => g.id === toGodown)?.name || "";

  const handleConfirm = () => {
    toast({
      title: "Transfer recorded successfully",
      description: `${qty} units of ${item.productName} moved to ${toGodownName}`,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-[560px] mx-4 rounded-xl border border-border bg-background p-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Transfer Stock</h2>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted/50 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Product (read-only) */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</label>
              <Input value={`${item.productName} (${item.sku})`} readOnly className="mt-1.5 h-12 rounded-xl bg-muted/30" />
            </div>

            {/* From */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transfer From</label>
              <Select value={fromGodown} onValueChange={setFromGodown}>
                <SelectTrigger className="mt-1.5 h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {godownLocations.filter(g => g.isActive).map(g => {
                    const stock = stockItems.find(si => si.productId === item.productId && si.godownId === g.id);
                    return (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} ({stock?.quantity || 0} units)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* To */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transfer To</label>
              <Select value={toGodown} onValueChange={setToGodown}>
                <SelectTrigger className="mt-1.5 h-12 rounded-xl">
                  <SelectValue placeholder="Select destination..." />
                </SelectTrigger>
                <SelectContent>
                  {godownLocations.filter(g => g.isActive && g.id !== fromGodown).map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quantity to Transfer</label>
              <Input
                type="number"
                min={1}
                max={maxQty}
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                className={`mt-1.5 h-12 rounded-xl ${isOverLimit ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {isOverLimit && (
                <p className="text-xs text-destructive mt-1">Only {maxQty} units available</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transfer Date</label>
              <Input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} className="mt-1.5 h-12 rounded-xl" />
            </div>

            {/* Remarks */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Remarks (optional)</label>
              <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Add notes about this transfer..." className="mt-1.5 rounded-xl resize-none" rows={3} />
            </div>

            {/* Transfer Summary */}
            {isValid && (
              <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
                Moving <span className="font-semibold">{qty} units</span> of <span className="font-semibold">{item.productName}</span> from <span className="font-semibold">{fromGodownName}</span> → <span className="font-semibold">{toGodownName}</span> on {transferDate}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button className="w-full h-12 rounded-xl" disabled={!isValid} onClick={handleConfirm}>
                Confirm Transfer
              </Button>
              <Button variant="ghost" className="w-full h-12 rounded-xl" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
