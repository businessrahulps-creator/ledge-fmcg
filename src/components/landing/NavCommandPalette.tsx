import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Sparkles,
  LayoutGrid,
  Workflow,
  Tag,
  User as UserIcon,
  LogIn,
  Rocket,
  Phone,
  MessageCircle,
} from "lucide-react";

interface NavCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NavCommandPalette({ open, onOpenChange }: NavCommandPaletteProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (href: string) => {
    onOpenChange(false);
    if (href.startsWith("#")) {
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        navigate("/" + href);
      }
    } else if (href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:")) {
      window.open(href, href.startsWith("http") ? "_blank" : "_self");
    } else {
      navigate(href);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, actions, or contact…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("#features")}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            <span>Features</span>
          </CommandItem>
          <CommandItem onSelect={() => go("#how-it-works")}>
            <Workflow className="mr-2 h-4 w-4" />
            <span>How It Works</span>
          </CommandItem>
          <CommandItem onSelect={() => go("#pricing")}>
            <Tag className="mr-2 h-4 w-4" />
            <span>Pricing</span>
          </CommandItem>
          <CommandItem onSelect={() => go("#founder")}>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Founder Note</span>
          </CommandItem>
          <CommandItem onSelect={() => go("#intelligence")}>
            <Sparkles className="mr-2 h-4 w-4" />
            <span>Ledge Intelligence</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem onSelect={() => go("/login")}>
            <LogIn className="mr-2 h-4 w-4" />
            <span>Sign in</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/signup")}>
            <Rocket className="mr-2 h-4 w-4" />
            <span>Start Free Trial</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Contact">
          <CommandItem onSelect={() => go("tel:+918138084689")}>
            <Phone className="mr-2 h-4 w-4" />
            <span>Call sales · +91 81380 84689</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              go("https://wa.me/918138084689?text=Hi%20Ledge%2C%20I%27d%20like%20to%20learn%20more")
            }
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            <span>WhatsApp sales</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
