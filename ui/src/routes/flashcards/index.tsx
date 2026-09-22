import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import {
  columnVisibilityFeature,
  createColumnHelper,
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
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
import { MOCKCOLLECTIONS } from "@/src/lib/mock";
import { Button } from "@/components/ui/button";
import { Play, Settings } from "lucide-react";

const tbFeatures = tableFeatures({
  columnVisibilityFeature,
  rowPaginationFeature,
  // rowSelectionFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const columnHelper = createColumnHelper<typeof tbFeatures, typeof MOCKCOLLECTIONS[number]>();

const FlashCardPage: React.FC = () => {
  const navigate = useNavigate();

  const columns = React.useMemo(() => columnHelper.columns([
    columnHelper.accessor("title", {
      header: "Name",
      meta: {
        width: "60%",
      }
    }),
    columnHelper.accessor("stats.new", {
      header: "New",
      cell: ({ row }) => {
        return (
          <p className="text-blue-500 font-semibold">{row.original.stats.new}</p>
        )
      },
      meta: {
        width: "10%",
      }
    }),
    columnHelper.accessor("stats.learn", {
      header: "Learn",
      cell: ({ row }) => {
        return (
          <p className="text-green-500 font-semibold">{row.original.stats.new}</p>
        )
      },
      meta: {
        width: "10%",
      }
    }),
    columnHelper.accessor("stats.due", {
      header: "Due",
      cell: ({ row }) => {
        return (
          <p className="text-red-500 font-semibold">{row.original.stats.new}</p>
        )
      },
      meta: {
        width: "10%",
      }
    }),
    columnHelper.display({
      id: "actions",
      cell: ({ row }) => {

        return (
          <div className="flex flex-row gap-4 w-fit">
            <Button
              size="icon-sm"
              onClick={() => {
                navigate({to: `/flashcards/${row.original.id}/learn`});
              }}
            >
              <Play />
            </Button>
            <Button
              size="icon-sm"
              variant="secondary"
              onClick={() => {

              }}
            >
              <Settings />
            </Button>
          </div>
        );
      },
      meta: {
        width: "10%",
      }
    })
  ]), []);

  const table = useTable({
    features: tbFeatures,
    columns,
    data: MOCKCOLLECTIONS,
  });


  return (
    <div className="w-300 mx-auto">
      <div className="">
        <h2 className="font-medium text-3xl">Flashcards</h2>
        <p className="text-muted-foreground">Choose a collection to study</p>
      </div>
      <Card className="rounded mt-10">
        <CardContent className="flex flex-row items-center justify-center">
          <Table className="min-w-150">
            <TableHeader>
              {
                table.getHeaderGroups().map((hg) => {

                  return (
                    <TableRow key={hg.id}>
                      {
                        hg.headers.map((h) => {
                          const width = (h.column.columnDef.meta as { width?: string }).width;
                          return (
                            <TableHead key={h.id} style={{ width }}>
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
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/flashcards/")({
  component: FlashCardPage,
});