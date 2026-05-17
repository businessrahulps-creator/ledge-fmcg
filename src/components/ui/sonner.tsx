import { useIsMobile } from "@/hooks/use-mobile";
import { Toaster as Sonner, toast } from "sonner";
import { CheckCircle2, AlertTriangle, XCircle, Info, Loader2 } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Ledge V2 — Editorial Serif toaster.
 * White card, Midnight ink, Playfair title + Inter body, semantic left bar,
 * Terracotta drain progress, Fluent decel slide+scale in.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const isMobile = useIsMobile();

  return (
    <Sonner
      position={isMobile ? "bottom-center" : "bottom-right"}
      visibleToasts={3}
      gap={10}
      duration={4000}
      closeButton
      className="toaster group"
      icons={{
        success: <CheckCircle2 className="h-[18px] w-[18px]" strokeWidth={1.75} />,
        error: <XCircle className="h-[18px] w-[18px]" strokeWidth={1.75} />,
        warning: <AlertTriangle className="h-[18px] w-[18px]" strokeWidth={1.75} />,
        info: <Info className="h-[18px] w-[18px]" strokeWidth={1.75} />,
        loading: <Loader2 className="h-[18px] w-[18px] animate-spin" strokeWidth={1.75} />,
      }}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: "ledge-toast group",
          title:
            "font-heading text-[16px] leading-[22px] tracking-[-0.005em] text-foreground font-semibold",
          description:
            "font-sans text-[13px] leading-[18px] text-muted-foreground mt-0.5",
          actionButton:
            "!bg-transparent !text-accent !font-medium hover:!underline underline-offset-4",
          cancelButton:
            "!bg-transparent !text-muted-foreground hover:!text-foreground",
          closeButton:
            "!bg-transparent !border-0 !text-muted-foreground hover:!text-foreground !left-auto !right-2 !top-2",
          icon: "ledge-toast-icon",
          success: "ledge-toast-success",
          error: "ledge-toast-error",
          warning: "ledge-toast-warning",
          info: "ledge-toast-info",
          loading: "ledge-toast-loading",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
