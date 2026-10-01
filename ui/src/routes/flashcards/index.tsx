import React from "react";
import { useAuth } from "@clerk/tanstack-react-start";
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
import { Button } from "@/components/ui/button";
import { Play, Settings } from "lucide-react";
import { getCollections } from "@/src/lib/api";
import { RemoteCollectionCard } from "@/src/types/collection.type";

const tbFeatures = tableFeatures({
  columnVisibilityFeature,
  rowPaginationFeature,
  // rowSelectionFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const columnHelper = createColumnHelper<typeof tbFeatures, RemoteCollectionCard>();

const FlashCardPage: React.FC = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [collections, setCollections] = React.useState<RemoteCollectionCard[]>([]);

  const columns = React.useMemo(() => columnHelper.columns([
    columnHelper.accessor("name", {
      header: "Name",
      meta: {
        width: "60%",
      }
    }),
    columnHelper.accessor("new", {
      header: "New",
      cell: ({ row }) => {
        return (
          <p className="text-blue-500 font-semibold">{row.original.new}</p>
        )
      },
      meta: {
        width: "10%",
      }
    }),
    columnHelper.accessor("learning", {
      header: "Learn",
      cell: ({ row }) => {
        return (
          <p className="text-green-500 font-semibold">{row.original.learning}</p>
        )
      },
      meta: {
        width: "10%",
      }
    }),
    columnHelper.accessor("due", {
      header: "Due",
      cell: ({ row }) => {
        return (
          <p className="text-red-500 font-semibold">{row.original.due}</p>
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
                navigate({ to: `/flashcards/${row.original.id}/learn` });
              }}
              disabled={row.original.new + row.original.learning + row.original.due === 0}
            >
              <Play />
            </Button>
            <Button
              size="icon-sm"
              variant="secondary"
              onClick={() => {
                navigate({
                  to: "/me/collections", search: {
                    collection: row.original.id,
                  }
                })
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
    data: collections,
  });

  React.useEffect(() => {
    const fetchCollections = async () => {
      try {
        const token = await getToken();
        const data = await getCollections(`Bearer ${token}`);

        setCollections(data);
      } catch (error) {
        console.error(error);
      }
    }

    fetchCollections();
  }, []);


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