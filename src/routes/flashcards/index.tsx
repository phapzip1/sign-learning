import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import {
  columnVisibilityFeature,
  createColumnHelper,
  createPaginatedRowModel,
  rowPaginationFeature,
  rowSelectionFeature,
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
}from "@/components/ui/table";
import { MOCKCOLLECTIONS } from "@/src/lib/mock";

const tbFeatures = tableFeatures({
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const columnHelper = createColumnHelper<typeof tbFeatures, typeof MOCKCOLLECTIONS[number]>();

const columns = columnHelper.columns([
  columnHelper.accessor("title", {
    header: "Name"
  }),
  columnHelper.accessor("stats.new", {
    header: "New",
  }),
  columnHelper.accessor("stats.learn", {
    header: "Learn"
  }),
  columnHelper.accessor("stats.due", {
    header: "Due"
  }),
])

const FlashCardPage: React.FC = () => {
  const table = useTable({
    features: tbFeatures,
    columns,
    data: MOCKCOLLECTIONS
  });


  return (
    <div className="w-full">
      {
        <Card className="rounded w-fit mx-auto mt-10">
          <CardContent className="flex flex-row items-center justify-center">
            <Table className="min-w-150">
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
          </CardContent>
        </Card>
      }
    </div>
  );
}

export const Route = createFileRoute("/flashcards/")({
  component: FlashCardPage,
});