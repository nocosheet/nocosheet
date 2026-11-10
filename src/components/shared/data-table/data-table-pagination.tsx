import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DataTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const ranges = Array.from({ length: pageCount }, (_, index) => ({
    value: index + 1,
    label: `${total === 0 ? 0 : index * pageSize + 1}-${Math.min((index + 1) * pageSize, total)}`,
  }));

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 whitespace-nowrap">
        <p className="text-muted-foreground text-sm">Viewing</p>
        <Select
          items={ranges}
          value={page}
          onValueChange={(value) => value !== null && onPageChange(value)}
        >
          <SelectTrigger aria-label="Select result range" className="w-fit min-w-0" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {ranges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
        <p className="text-muted-foreground text-sm">
          of <strong className="font-medium text-foreground">{total}</strong> results
        </p>
      </div>
      <Pagination className="justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className="sm:*:[svg]:hidden"
              render={
                <Button
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                  size="sm"
                  variant="outline"
                />
              }
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              className="sm:*:[svg]:hidden"
              render={
                <Button
                  disabled={page >= pageCount}
                  onClick={() => onPageChange(page + 1)}
                  size="sm"
                  variant="outline"
                />
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
