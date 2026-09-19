import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Calendar, FileText, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import WordTable from "@/src/components/word-table";
import { MOCKCOLLECTIONS, MOCKSTOREDWORDS } from "@/src/lib/mock";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const params = Route.useSearch();
  const [search, setSearch] = React.useState<string>("");
  const [selectedRows, setSelectedRows] = React.useState<number[]>([]);

  return (
    <div className="flex flex-row gap-4 w-400 h-full">
      <Card className="p-0 rounded min-h-200 h-200">
        <CardContent className="flex flex-col py-2">
          <SidebarProvider
          >
            <Sidebar
              // variant="inset"
              className="bg-transparent "
              collapsible="none"
            >
              <SidebarHeader>
                <h3 className="text-2xl font-medium">Your collection</h3>
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <Button className="flex flex-row items-center justify-center gap-4">
                    <Plus />
                    New collection
                  </Button>
                </SidebarGroup>
                <Separator />
                <SidebarGroup>
                  <Input
                    placeholder="...Search collection"
                    className="border"
                    name="search-collection"
                  />
                </SidebarGroup>
                <Separator />
                <SidebarGroup
                  className="gap-2"
                >
                  <SidebarMenuButton
                    className="font-medium"
                    variant="outline"
                    isActive={!params || params.collection === -1}
                    onClick={() => {
                      navigate({
                        from: "/me/collections",
                        search: {
                          collection: -1
                        }
                      })
                    }}
                  >
                    ALL
                  </SidebarMenuButton>
                  {
                    MOCKCOLLECTIONS.map((collection) => {

                      return (
                        <SidebarMenuButton
                          key={collection.id}
                          className="font-medium"
                          variant="outline"
                          isActive={params && params.collection === collection.id}
                          onClick={() => {
                            navigate({
                              from: "/me/collections",
                              search: {
                                collection: collection.id
                              }
                            })
                          }}
                        >
                          {collection.title}
                        </SidebarMenuButton>
                      );
                    })
                  }
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
          </SidebarProvider>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4 flex-1">
        <Card className="rounded p-0 min-h-40">
          <CardContent className="flex flex-row justify-between py-4 h-full">
            <div className="flex flex-col justify-between flex-1">
              <span>
                <h2 className="text-3xl font-semibold">
                  Title
                </h2>
                <p className="mt-2">Description</p>
              </span>
              <div className="flex flex-row gap-6 text-muted-foreground items-center">
                <span className="flex flex-row gap-2">
                  <FileText className="size-4.5" />
                  <p>12 words</p>
                </span>
                <span className="flex flex-row gap-2">
                  <Calendar className="size-4.5" />
                  <p>Updated 12:00 Aug 10, 2024</p>
                </span>
              </div>
            </div>
            <div className="flex flex-row gap-4 items-start h-fit">

              <Sheet
              >
                <SheetTrigger render={
                  <Button
                    variant="outline"
                  >
                    Edit
                  </Button>
                }>

                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Are you absolutely sure?</SheetTitle>
                    <SheetDescription>This action cannot be undone.</SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>
              <Dialog>
                <DialogTrigger className={buttonVariants({ variant: "destructive" })}>
                  Delete
                </DialogTrigger>
                <DialogContent showCloseButton={false}>
                  <DialogHeader>
                    <DialogTitle>
                      Are you sure?
                    </DialogTitle>
                    <DialogDescription>
                      This action cannot be reverted!
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex flex-row justify-between">
                    <DialogClose
                      render={
                        <Button variant="secondary" type="button">
                          Cancel
                        </Button>
                      }
                    >
                    </DialogClose>
                    <Button variant="destructive">
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
        <Card className="flex flex-row rounded p-0 flex-1">
          <CardContent className="flex flex-col size-full py-4 gap-4">
            <div className="flex flex-row w-full gap-4">
              <Input
                className=""
                placeholder="Search words in this collection"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {
                selectedRows.length !== 0 && (
                  <Dialog>
                    <DialogTrigger className={buttonVariants({ variant: "destructive" })}>
                      Delete selected
                    </DialogTrigger>
                    <DialogContent showCloseButton={false}>
                      <DialogHeader>
                        <DialogTitle>
                          Are you sure?
                        </DialogTitle>
                        <DialogDescription>
                          This action cannot be reverted!
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="flex flex-row justify-between">
                        <DialogClose
                          render={
                            <Button variant="secondary" type="button">
                              Cancel
                            </Button>
                          }
                        >
                        </DialogClose>
                        <Button variant="destructive">
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )
              }
            </div>
            <WordTable
              className="w-full flex-1"
              data={MOCKSTOREDWORDS}
              onSelectedChange={(data) => setSelectedRows(data.map(row => row.id))}
            />
          </CardContent>
        </Card>
      </div>
      <Sheet
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Are you absolutely sure?</SheetTitle>
            <SheetDescription>This action cannot be undone.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export const Route = createFileRoute("/me/collections")({
  component: FavoritesPage,
  validateSearch: (search: Record<string, unknown>) => {
    if (search) {
      return {
        collection: search.collection || -1,
      }
    }
  }
})
