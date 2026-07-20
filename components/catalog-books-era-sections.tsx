import type { ReactNode } from "react";
import {
  groupCatalogBooksByEra,
  type CatalogBookEraSortable,
} from "@/lib/client/catalog-books-by-era";
import { formatYearRange } from "@/lib/format";
import type { Era } from "@/lib/types";

type CatalogBooksEraSectionsProps<T extends CatalogBookEraSortable> = {
  books: T[];
  eras: Era[];
  getBookKey: (book: T) => string | number;
  renderBook: (book: T) => ReactNode;
  emptyMessage?: ReactNode;
};

export function CatalogBooksEraSections<T extends CatalogBookEraSortable>({
  books,
  eras,
  getBookKey,
  renderBook,
  emptyMessage,
}: CatalogBooksEraSectionsProps<T>) {
  const groups = groupCatalogBooksByEra(books, eras);

  if (groups.length === 0) {
    return emptyMessage ? <>{emptyMessage}</> : null;
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const yearRange =
          group.startYear != null && group.endYear != null
            ? formatYearRange(group.startYear, group.endYear)
            : null;
        return (
          <section key={group.eraId ?? "multi-era"} className="space-y-2">
            <div className="border-b border-border pb-2">
              <h2 className="text-base font-semibold text-foreground">{group.eraName}</h2>
              {yearRange ? <p className="text-xs text-muted">{yearRange}</p> : null}
            </div>
            <ul className="divide-y divide-border rounded-xl border border-border bg-surface/30">
              {group.books.map((book) => (
                <li key={getBookKey(book)}>{renderBook(book)}</li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
