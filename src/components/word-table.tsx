import { cn } from "@/lib/utils";
import { createColumnHelper, useTable } from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { StoredWordItem } from "@/src/types/word.type";
import { baseTableFeatures } from "@/src/lib/tables";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type WordTableProps = {
    data: StoredWordItem[];
    className?: string;
    onSelectedItem?: (data: StoredWordItem) => void;
}

const columnHelper = createColumnHelper<typeof baseTableFeatures, StoredWordItem>()
const columns = columnHelper.columns([
    columnHelper.accessor("word.title", {
        header: "Word",
    }),
    columnHelper.accessor("word.description", {
        header: "Description",
    }),
    columnHelper.accessor("state", {
        header: "State",
    }),
    columnHelper.accessor("word.level", {
        header: "Level"
    }),
])

const WordTable: React.FC<WordTableProps> = ({
    data,
    className,
    onSelectedItem
}) => {
    const table = useTable({
        features: baseTableFeatures,
        columns: [
            ...columns,
            columnHelper.display({
                id: "actions",
                cell: ({ row }) => {
                    const { original } = row;

                    return (
                        <Button
                            onClick={() => onSelectedItem?.(original)}
                            className="text-red-500"
                            variant="outline"
                            size="icon-sm"
                        >
                            <Trash2 />
                        </Button>
                    );
                }
            }),
        ],
        data,
    });

    return (
        <Table className={cn("", className)}>
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
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )
                }
            </TableBody>
        </Table>
    );
}

export default WordTable;