import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface ListPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ListPagination({ page, totalPages, onPageChange }: ListPaginationProps) {
  if (totalPages <= 1) return null;

  // Calculate visible page numbers (up to 5)
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 3) return [1, 2, 3, 4, "ellipsis", totalPages];
    if (page >= totalPages - 2) return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages];
  };

  const pages = getPageNumbers();

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => page > 1 && onPageChange(page - 1)}
            className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>

        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <PaginationItem key={`e-${i}`} className="hidden sm:block">
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p} className="hidden sm:block">
              <PaginationLink
                isActive={p === page}
                onClick={() => onPageChange(p)}
                className="cursor-pointer"
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        {/* Mobile: show "Page X of Y" */}
        <PaginationItem className="sm:hidden">
          <span className="flex h-9 items-center px-2 text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
        </PaginationItem>

        <PaginationItem>
          <PaginationNext
            onClick={() => page < totalPages && onPageChange(page + 1)}
            className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
