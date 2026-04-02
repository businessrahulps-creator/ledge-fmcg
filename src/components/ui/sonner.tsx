import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/80 group-[.toaster]:backdrop-blur-xl group-[.toaster]:backdrop-saturate-[1.8] group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:!border-success/30",
          error: "group-[.toaster]:!border-destructive/30",
          warning: "group-[.toaster]:!border-warning/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
