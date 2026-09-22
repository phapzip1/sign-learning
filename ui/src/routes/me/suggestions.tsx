import React, { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  type SortingState,
  createColumnHelper,
  flexRender,
  // features
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from "@/components/ui/combobox";
import { WordKinds } from "@/src/types/word.type";
import { Card, CardContent } from "@/components/ui/card";

type FormState = {
  word: string;
  translation: string;
  partOfSpeech: string;
  description: string;
  example: string;
  tags: string;
};

const initialState: FormState = {
  word: "",
  translation: "",
  partOfSpeech: "",
  description: "",
  example: "",
  tags: "",
};

type Suggestion = {
  id: string;
  word: string;
  translation: string;
  partOfSpeech?: string;
  description?: string;
  example?: string;
  tags?: string[];
  createdAt: string;
};

const STORAGE_KEY = "suggestions";

// Register table features (v9+): filtering, visibility, pagination, selection, sorting
export const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

const columnHelper = createColumnHelper<typeof features, Suggestion>();
const columns = columnHelper.columns(
  [
    columnHelper.accessor("word", {
      header: "Word",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("translation", {
      header: "Translation",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor((row) => row.partOfSpeech ?? "", {
      id: "partOfSpeech",
      header: "Part of speech",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor((row) => (row.tags || []).join(", "), {
      id: "tags",
      header: "Tags",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("description", {
      header: "Description",
      cell: (info) => {
        const v = info.getValue<string>() || "";
        return v.length > 80 ? v.slice(0, 80) + "…" : v;
      },
    }),
    columnHelper.accessor("createdAt", {
      header: "Submitted",
      cell: (info) => new Date(info.getValue()).toLocaleString(),
    }),
  ],
);

export type DataTableFeatures = typeof features;

const WordSuggestionsPage: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageSize, setPageSize] = useState<number>(10);

  const table = useTable({
    features,
    columns,
    data: items,
  });

  useEffect(() => {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Suggestion[];
      setItems(existing.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
    } catch {
      setItems([]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const validate = (): string | null => {
    if (!form.word.trim()) return "Word is required";
    if (!form.translation.trim()) return "Translation is required";
    return null;
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      const newItem: Suggestion = {
        id: (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") ? (crypto as any).randomUUID() : String(Date.now()),
        word: form.word.trim(),
        translation: form.translation.trim(),
        partOfSpeech: form.partOfSpeech || undefined,
        description: form.description || undefined,
        example: form.example || undefined,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) || [],
        createdAt: new Date().toISOString(),
      };

      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Suggestion[];
      const updated = [newItem, ...existing];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      setItems(updated);
      setSuccess("Suggestion submitted — thank you!");
      setForm(initialState);
      setOpen(false);
    } catch (err: any) {
      setError(err?.message || "Failed to submit suggestion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-400 mx-auto">
      <Card className="rounded p-0 mb-4">
        <CardContent className="flex items-center justify-between py-4">
          <h2 className="block text-xl font-semibold">Your suggestions</h2>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className={buttonVariants({ variant: "default" })}
            >
              Suggest a new word
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Suggest a New Word</SheetTitle>
                <SheetDescription>Provide details about the sign and submit it for review.</SheetDescription>
              </SheetHeader>

              <div className="p-8">
                {error && <div className="text-red-700 bg-red-100 p-2 rounded mb-4">{error}</div>}
                {success && <div className="text-green-700 bg-green-100 p-2 rounded mb-4">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label className="mb-1">Word (in sign language)</Label>
                    <Input name="word" value={form.word} onChange={handleChange} placeholder="Enter the word or gloss" required />
                  </div>

                  <div>
                    <Label className="mb-1">Meaning</Label>
                    <Input
                      name="translation"
                      value={form.translation}
                      onChange={handleChange}
                      placeholder="English translation"
                      required
                    />
                  </div>

                  <div>
                    <Label className="mb-1">Part of speech</Label>
                    <Combobox items={WordKinds}>
                      <ComboboxInput placeholder="All category" className="mb-2" readOnly required />
                      <ComboboxContent>
                        <ComboboxEmpty>No items found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item: string) => (
                            <ComboboxItem key={item} value={item}>
                              {item.toUpperCase()}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>

                  <div>
                    <Label className="mb-1">Description</Label>
                    <Textarea name="description" value={form.description} onChange={handleChange} placeholder="Usage notes, handshape, movement, or link to a video recording" rows={4} />
                  </div>

                  <div>
                    <Label className="mb-1">Tags (comma separated)</Label>
                    <Input name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. food,vegetable,basic" />
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <Button type="submit" variant="default" disabled={loading}>
                      {loading ? "Submitting..." : "Submit Suggestion"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setForm(initialState);
                        setError(null);
                        setSuccess(null);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </div>

              <SheetFooter />
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>

      <Card className="rounded p-0">
        <CardContent className="py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Showing {items.length} suggestion{items.length !== 1 ? "s" : ""}</div>
          </div>

          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className="flex items-center gap-2 cursor-pointer select-none"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {
                            flexRender(header.column.columnDef.header, header.getContext())
                          }
                          <span className="opacity-50 text-xs">
                            {header.column.getIsSorted() === "asc" ? " ▲" : header.column.getIsSorted() === "desc" ? " ▼" : ""}
                          </span>
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-6 text-center text-muted-foreground">
                    No suggestions yet. Use the button above to add one.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {
                      row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {
                            flexRender(cell.column.columnDef.cell, cell.getContext())
                          }
                        </TableCell>
                      ))
                    }
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {table.state.pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                Previous
              </Button>
              <Button variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/me/suggestions")({
  component: WordSuggestionsPage,
});