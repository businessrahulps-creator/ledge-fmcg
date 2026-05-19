import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { MobileSearchSheet } from "@/components/ui/mobile-search-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { getRecent, type RecentItem } from "@/lib/recent-items";
import { useApi } from "@/services/api";
import { useCan } from "@/hooks/useCan";

import {
  House,
  ClipboardList,
  Package,
  TrendingUp,
  UserRound,
  UserCheck,
  Gift,
  Target,
  ChartNoAxesCombined,
  FileText,
  Landmark,
  RotateCcw,
  BookOpen,
  Settings,
  Plus,
  Search,
  Clock,
} from "lucide-react";

/**
 * Universal Cmd/Ctrl+K command palette — the single biggest perceived-
 * intelligence move we can make. Searches:
 *   • navigation (every route in the app)
 *   • orders (by id / dealer / status)
 *   • dealers (by name / phone / city)
 *   • products (by name / SKU)
 *   • quick actions ("New order")
 *
 * Listens globally for Cmd/Ctrl+K (and `/` when no input is focused).
 * Closed state renders nothing — zero perf cost.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const navigate = useNavigate();
  const api = useApi();
  const canPlaceOrders = useCan("place_orders");
  const isMobile = useIsMobile();


  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "/" && !open) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
        e.preventDefault();
        setOpen(true);
      }
    };
    const openEvt = () => setOpen(true);
    window.addEventListener("keydown", handler);
    window.addEventListener("ledge:open-command-palette", openEvt as EventListener);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("ledge:open-command-palette", openEvt as EventListener);
    };
  }, [open]);

  // Only fetch lists once the palette is opened — keeps the closed-state
  // cost to zero and avoids subscribing the whole app to data churn.
  const orders = open ? api.orders.list() : [];
  const dealers = open ? api.dealers.list() : [];
  const products = open ? api.products.list() : [];

  // Hydrate recent items when the palette opens.
  useEffect(() => {
    if (open) setRecent(getRecent().slice(0, 5));
  }, [open]);

  const q = query.trim().toLowerCase();

  const matchedOrders = useMemo(() => {
    if (!open) return [];
    const base = q
      ? orders.filter((o: any) => {
          const id = String(o.id ?? o.orderNumber ?? "").toLowerCase();
          const dealer = String(o.dealerName ?? o.distributorName ?? "").toLowerCase();
          return id.includes(q) || dealer.includes(q);
        })
      : orders;
    return base.slice(0, 6);
  }, [orders, q, open]);

  const matchedDealers = useMemo(() => {
    if (!open) return [];
    const base = q
      ? dealers.filter((d: any) => {
          const name = String(d.name ?? "").toLowerCase();
          const phone = String(d.phone ?? "").toLowerCase();
          const city = String(d.city ?? "").toLowerCase();
          return name.includes(q) || phone.includes(q) || city.includes(q);
        })
      : dealers;
    return base.slice(0, 6);
  }, [dealers, q, open]);

  const matchedProducts = useMemo(() => {
    if (!open) return [];
    const base = q
      ? products.filter((p: any) => {
          const name = String(p.name ?? "").toLowerCase();
          const sku = String(p.sku ?? p.code ?? "").toLowerCase();
          return name.includes(q) || sku.includes(q);
        })
      : products;
    return base.slice(0, 6);
  }, [products, q, open]);

  const go = (to: string) => {
    setOpen(false);
    setQuery("");
    navigate(to);
  };

  const NAV: { label: string; to: string; icon: any }[] = [
    { label: "Dashboard", to: "/dashboard", icon: House },
    { label: "Orders", to: "/orders", icon: ClipboardList },
    { label: "Stock", to: "/stock", icon: Package },
    { label: "Performance", to: "/performance", icon: TrendingUp },
    { label: "Dealers", to: "/distributors", icon: UserRound },
    { label: "Sales Team", to: "/salespersons", icon: UserCheck },
    { label: "Schemes", to: "/schemes", icon: Gift },
    { label: "Targets", to: "/targets", icon: Target },
    { label: "Reports", to: "/reports", icon: ChartNoAxesCombined },
    { label: "Billing", to: "/billing", icon: FileText },
    { label: "Company", to: "/company", icon: Landmark },
    { label: "Returns", to: "/claims", icon: RotateCcw },
    { label: "Help", to: "/help", icon: BookOpen },
    { label: "Settings", to: "/settings", icon: Settings },
  ];

  const listContent = (
    <CommandList className={isMobile ? "max-h-none flex-1 overflow-y-auto" : undefined}>

        <CommandEmpty>No matches. Try a different search.</CommandEmpty>

        {!q && recent.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recent.map((r) => (
                <CommandItem
                  key={`recent-${r.to}`}
                  value={`recent ${r.label.toLowerCase()} ${r.hint?.toLowerCase() ?? ""}`}
                  onSelect={() => go(r.to)}
                >
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{r.label}</span>
                  {r.hint && (
                    <span className="ml-2 truncate text-xs text-muted-foreground">{r.hint}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Quick actions">
          {canPlaceOrders && (
            <CommandItem value="new-order action create" onSelect={() => go("/orders/new")}>
              <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
              New order
              <CommandShortcut>N</CommandShortcut>
            </CommandItem>
          )}
          <CommandItem value="search-orders action" onSelect={() => go("/orders")}>
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            Search all orders
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Go to">
          {NAV.map((n) => (
            <CommandItem key={n.to} value={`nav ${n.label.toLowerCase()}`} onSelect={() => go(n.to)}>
              <n.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {n.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {matchedOrders.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Orders">
              {matchedOrders.map((o: any) => {
                const id = o.id ?? o.orderNumber ?? "";
                const dealer = o.dealerName ?? o.distributorName ?? "—";
                return (
                  <CommandItem
                    key={`order-${id}`}
                    value={`order ${id} ${dealer}`}
                    onSelect={() => go(`/orders/${id}`)}
                  >
                    <ClipboardList className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{String(id)}</span>
                    <span className="ml-2 truncate text-xs text-muted-foreground">{dealer}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {matchedDealers.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Dealers">
              {matchedDealers.map((d: any) => (
                <CommandItem
                  key={`dealer-${d.id}`}
                  value={`dealer ${d.name} ${d.city ?? ""}`}
                  onSelect={() => go(`/distributors/${d.id}`)}
                >
                  <UserRound className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{d.name}</span>
                  {d.city && (
                    <span className="ml-2 truncate text-xs text-muted-foreground">{d.city}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {matchedProducts.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Products">
              {matchedProducts.map((p: any) => (
                <CommandItem
                  key={`product-${p.id}`}
                  value={`product ${p.name} ${p.sku ?? ""}`}
                  onSelect={() => go(`/stock`)}
                >
                  <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{p.name}</span>
                  {p.sku && (
                    <span className="ml-2 truncate text-xs text-muted-foreground">{p.sku}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
  );

  if (isMobile) {
    return (
      <MobileSearchSheet
        open={open}
        onOpenChange={setOpen}
        title="Search"
        headerSlot={
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search orders, dealers, products…"
            className="h-10 text-base"
          />
        }
      >
        <Command
          className="flex h-full flex-col [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-1 [&_[cmdk-item]]:min-h-[48px] [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2 [&_[cmdk-item]]:text-[15px] [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          shouldFilter
          value={undefined}
        >
          {/* Hidden mirror input so cmdk picks up the query from headerSlot */}
          <CommandInput value={query} onValueChange={setQuery} className="sr-only" />
          {listContent}
        </Command>
      </MobileSearchSheet>
    );
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search orders, dealers, products, or jump to a page…"
      />
      {listContent}
    </CommandDialog>
  );
}

