import React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpDown, ArrowUpRight } from "lucide-react";
import {
    createColumnHelper,
    FilterFn,
    OnChangeFn,
    RowSelectionState,
    type
        SortingState,
    useTable
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { baseTableFeatures } from "@/src/lib/tables";
import { RemoteWordCard } from "@/src/types/word.type";

type WordTableProps = {
    data: RemoteWordCard[];
    className?: string;
    search?: string;
    selection?: RowSelectionState;
    onSelectedChange?: OnChangeFn<RowSelectionState>;
}

const columnHelper = createColumnHelper<typeof baseTableFeatures, RemoteWordCard>();

const myCustomFilterFn: FilterFn<typeof baseTableFeatures, RemoteWordCard> = (
    row,
    columnId,
    filterValue,
) => {

    const search = String(filterValue ?? "")
        .trim()
        .toLowerCase();

    if (!search) return true;

    return String(row.getValue(columnId) ?? "")
        .toLowerCase()
        .includes(search);

}

const WordTable: React.FC<WordTableProps> = ({
    data,
    className,
    onSelectedChange,
    search,
    selection
}) => {
    const actColumns = React.useMemo(() => columnHelper.columns([
        // columnHelper.display({
        //     "id": "select",
        //     header: () => {

        //         return (
        //             <Checkbox
        //                 checked={table.getIsAllPageRowsSelected()}
        //                 indeterminate={
        //                     table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
        //                 }
        //                 onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        //                 aria-label="Select all"
        //             />
        //         );
        //     },
        //     cell: ({ row }) => {
        //         return (
        //             <Checkbox
        //                 checked={row.getIsSelected()}
        //                 onCheckedChange={(value) => row.toggleSelected(!!value)}
        //                 aria-label="Select row"
        //             />
        //         );
        //     }
        // }),
        columnHelper.accessor("title", {
            filterFn: myCustomFilterFn,
            header: ({ column }) => {

                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Title
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            }
        }),
        columnHelper.accessor("meaning", {
            header: "Description",

            cell: ({ row }) => {
                return (
                    <p className="max-w-80 truncate">{row.original.meaning}</p>
                );
            }
        }),
        columnHelper.accessor("state", {
            header: ({ column }) => {

                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        State
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            }
        }),
        columnHelper.accessor("level", {
            header: ({ column }) => {

                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Level
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            }
        }),
        columnHelper.display({
            "id": "actions",
            header: "Actions",
            cell: ({ row }) => {
                return (
                    <div className="flex flex-row gap-4">
                        <Link to={"/dictionary/" + row.original.wordId} className={buttonVariants({ size: "icon-sm", variant: "outline" })} >
                            <ArrowUpRight />
                        </Link>
                    </div>
                )
            }
        })
    ]), []);

    const columnFilters = React.useMemo(() => [
        {
            id: "title",
            value: search ?? "",
        },
    ], [search]);

    const [sorting, setSorting] = React.useState<SortingState>([]);

    const table = useTable({
        features: baseTableFeatures,
        columns: actColumns,
        data,
        onSortingChange: setSorting,
        onRowSelectionChange: onSelectedChange,
        state: {
            sorting,
            rowSelection: selection,
            columnFilters
        },

    });

    return (
        <div className={cn("flex flex-col gap-2 justify-between", className)}>
            <Table>
                <TableHeader>
                    {
                        table.getHeaderGroups().map((hg) => {

                            return (
                                <TableRow key={hg.id}>
                                    {
                                        hg.headers.map((h) => {
                                            return (
                                                <TableHead key={h.id}>
                                                    {
                                                        h.isPlaceholder ? null : (
                                                            <table.FlexRender header={h} />
                                                        )
                                                    }
                                                </TableHead>
                                            );
                                        })
                                    }
                                </TableRow>
                            );
                        })
                    }
                </TableHeader>
                <TableBody>
                    {
                        table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => {

                                return (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                    >
                                        {
                                            row.getVisibleCells().map((cell) => {

                                                return (
                                                    <TableCell key={cell.id}>
                                                        <table.FlexRender cell={cell} />
                                                    </TableCell>
                                                )
                                            })
                                        }
                                    </TableRow>
                                )
                            })
                        ) :
                            (
                                <TableRow>
                                    <TableCell colSpan={actColumns.length} className="h-24 text-center">
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )
                    }
                </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 mt-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

export default WordTable;