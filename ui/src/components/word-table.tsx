import React from "react";
import { createColumnHelper, type SortingState, useTable } from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { StoredWordItem } from "@/src/types/word.type";
import { baseTableFeatures } from "@/src/lib/tables";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

type WordTableProps = {
    data: StoredWordItem[];
    className?: string;
    onSelectedChange?: (data: StoredWordItem[]) => void;
    search?: string;
}

const columnHelper = createColumnHelper<typeof baseTableFeatures, StoredWordItem>();

const WordTable: React.FC<WordTableProps> = ({
    data,
    className,
    onSelectedChange,
    search,
}) => {
    const actColumns = React.useMemo(() => columnHelper.columns([
        columnHelper.display({
            "id": "select",
            header: () => {

                return (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        indeterminate={
                            table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
                        }
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                );
            },
            cell: ({ row }) => {
                
                return (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                );
            }
        }),
        columnHelper.accessor("word.title", {
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
        columnHelper.accessor("word.description", {
            header: "Description",
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
        columnHelper.accessor("word.level", {
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
                    <Link to={"/dictionary/" + row.original.id} className={buttonVariants({ size: "icon-sm", variant: "outline" })} >
                        <ArrowUpRight />
                    </Link>
                )
            }
        })
    ]), []);

    const [sorting, setSorting] = React.useState<SortingState>([]);

    const table = useTable({
        features: baseTableFeatures,
        columns: actColumns,
        data,
        onSortingChange: setSorting,
        // onRowSelectionChange: (updater) => {
        //     onSelectedChange?.(table.getSelectedRowModel().rows.map(row => row.original));
        // },
        state: {
            sorting,
        }
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