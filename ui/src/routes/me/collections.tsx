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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { RemoteCollectionCard } from "@/src/types/collection.type";
import { deleteCollection, getCards, getCollections } from "@/src/lib/api";
import { useAuth } from "@clerk/tanstack-react-start";
import { RemoteWordCard } from "@/src/types/word.type";
import DeckEditor from "@/src/components/deck-editor";

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const params = Route.useSearch();
  const { getToken } = useAuth();

  const [search, setSearch] = React.useState<string>("");
  const [collections, setCollections] = React.useState<RemoteCollectionCard[]>([]);
  const [cards, setCards] = React.useState<RemoteWordCard[]>([]);
  const [searchCollection, setSearchCollection] = React.useState<string>("");
  const deleteDialogRef = React.useRef<any>(null);

  const fetchCollection = async () => {
    try {
      const token = await getToken();
      const data = await getCollections(`Bearer ${token}`);
      setCollections(() => data);
    } catch (error) {
      console.error(error);
    }
  }

  React.useEffect(() => {
    fetchCollection();
  }, []);

  React.useEffect(() => {
    const fetchCards = async () => {
      if (params?.collection && params.collection.length > 0) {
        try {
          const token = await getToken();
          const data = await getCards(params.collection, `Bearer ${token}`);
          setCards(() => data);
        } catch (error) {
          console.error(error);
        }
      }
    }
    fetchCards();
  }, [params]);

  const collection = collections.find(col => col.id === params?.collection);


  const delCollection = async () => {
    if (!collection) {
      return;
    }

    try {
      const token = await getToken();
      await deleteCollection(collection.id, `Bearer ${token}`);

      deleteDialogRef.current?.close();
      navigate({ from: "/me/collections", search: { collection: "" } });
      fetchCollection();
    } catch (error) {
      console.error(error);
    }
  }


  return (
    <div className="flex flex-row gap-4 w-400 h-full">
      <Card className="p-0 rounded min-h-200 h-200">
        <CardContent className="flex flex-col py-2">
          <SidebarProvider
          >
            <Sidebar
              className="bg-transparent "
              collapsible="none"
            >
              <SidebarHeader>
                <h3 className="text-2xl font-medium">Your collection</h3>
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <DeckEditor
                    trigger={
                      <Button
                        className="flex flex-row items-center justify-center gap-4"
                      >
                        <Plus />
                        New collection
                      </Button>
                    }
                    onCompleted={() => {
                      console.log("vao");

                      fetchCollection();

                    }}
                  />
                </SidebarGroup>
                <Separator />
                <SidebarGroup>
                  <Input
                    placeholder="...Search collection"
                    className="border"
                    name="search-collection"
                    value={searchCollection}
                    onChange={e => setSearchCollection(e.target.value)}
                  />
                </SidebarGroup>
                <Separator />
                <SidebarGroup
                  className="gap-2"
                >
                  {
                    collections.filter(x => searchCollection.length === 0 || x.name.includes(searchCollection)).map((collection) => {

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
                          {collection.name}
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
        {
          !collection
            ?
            <Card>
              <CardContent className="flex flex-row justify-center items-center">
                "Select a collection to continue"
              </CardContent>
            </Card>
            : <>
              <Card className="rounded p-0 min-h-40">
                <CardContent className="flex flex-row justify-between py-4 h-full">
                  <div className="flex flex-col justify-between flex-1">
                    <span>
                      <h2 className="text-3xl font-semibold">
                        {collection.name}
                      </h2>
                      <p className="mt-2">{collection.description}</p>
                    </span>
                    <div className="flex flex-row gap-6 text-muted-foreground items-center">
                      <span className="flex flex-row gap-2">
                        <FileText className="size-4.5" />
                        <p>{cards.length} words</p>
                      </span>
                      <span className="flex flex-row gap-2">
                        <Calendar className="size-4.5" />
                        <p>Updated {new Date().toISOString()}</p>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-row gap-4 items-start h-fit">

                    <DeckEditor
                      title={collection.name}
                      description={collection.description}
                      id={collection.id}
                      trigger={
                        <Button variant="secondary">
                          Edit
                        </Button>
                      }
                      onCompleted={() => {
                        console.log("vao");

                        fetchCollection();

                      }}
                    />
                    <Dialog
                      actionsRef={deleteDialogRef}
                    >
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
                          <Button
                            variant="destructive"
                            onClick={delCollection}
                          >
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
                    {/* {
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
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  
                                }}
                              >
                                Delete
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )
                    } */}
                  </div>
                  <WordTable
                    className="w-full flex-1"
                    data={cards}
                    search={search}
                  // onSelectedChange={(data) => selectRows(data.map(row => row.id))}
                  />
                </CardContent>
              </Card>
            </>
        }
      </div>
    </div>
  );
}

export const Route = createFileRoute("/me/collections")({
  component: FavoritesPage,
  validateSearch: (search: Record<string, unknown>) => {
    if (search) {
      return {
        collection: search["collection"] as string,
      } satisfies {
        collection?: string;
      }
    }
  }
})
