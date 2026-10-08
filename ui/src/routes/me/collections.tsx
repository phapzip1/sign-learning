import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Calendar, FileText, Layers3, Pencil, Play, Plus, Search, Trash2 } from "lucide-react";
import { cn } from "cn";
import { Card, CardContent } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Button, buttonVariants } from "@/components/ui/button";
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
import EmptyState from "@/src/components/empty-state";

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
  const filteredCollections = collections.filter(x => searchCollection.length === 0 || x.name.toLowerCase().includes(searchCollection.toLowerCase()));


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
    <div className="grid w-full gap-6 lg:grid-cols-[300px_1fr]">
      {/* Collection list */}
      <Card className="h-fit lg:sticky lg:top-24" size="sm">
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-extrabold">Your collections</h3>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
              {collections.length}
            </span>
          </div>
          <DeckEditor
            trigger={
              <Button className="w-full">
                <Plus />
                New collection
              </Button>
            }
            onCompleted={() => {
              fetchCollection();
            }}
          />
          <InputGroup>
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search collections"
              name="search-collection"
              value={searchCollection}
              onChange={e => setSearchCollection(e.target.value)}
            />
          </InputGroup>
          <div className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto lg:max-h-[60vh]">
            {
              filteredCollections.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                  {collections.length === 0 ? "No collections yet." : "No matches."}
                </p>
              ) : filteredCollections.map((item) => {
                const active = params && params.collection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                        : "hover:bg-muted"
                    )}
                    onClick={() => {
                      navigate({
                        from: "/me/collections",
                        search: {
                          collection: item.id
                        }
                      })
                    }}
                  >
                    <Layers3 className={cn("size-4 shrink-0", active ? "" : "text-primary")} />
                    <span className="truncate">{item.name}</span>
                  </button>
                );
              })
            }
          </div>
        </CardContent>
      </Card>

      <div className="flex min-w-0 flex-col gap-6">
        {
          !collection
            ?
            <EmptyState
              icon={Layers3}
              title="Pick a collection"
              description="Choose a collection on the left to see its words, or create a new one to get started."
              className="h-full min-h-80"
            />
            : <>
              <Card>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-3">
                    <div>
                      <h2 className="text-3xl font-black">
                        {collection.name}
                      </h2>
                      {collection.description && (
                        <p className="mt-1 text-muted-foreground">{collection.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 font-semibold text-secondary-foreground">
                        <FileText className="size-4" />
                        {cards.length} {cards.length === 1 ? "word" : "words"}
                      </span>
                      {collection.updatedAt && (
                        <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 font-semibold text-muted-foreground">
                          <Calendar className="size-4" />
                          Updated {new Date(collection.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-row gap-2">
                    <Button
                      variant="highlight"
                      onClick={() => navigate({ to: `/flashcards/${collection.id}/learn` })}
                      disabled={collection.new + collection.learning + collection.due === 0}
                    >
                      <Play className="fill-current" />
                      Study
                    </Button>
                    <DeckEditor
                      title={collection.name}
                      description={collection.description}
                      id={collection.id}
                      trigger={
                        <Button variant="outline">
                          <Pencil />
                          Edit
                        </Button>
                      }
                      onCompleted={() => {
                        fetchCollection();
                      }}
                    />
                    <Dialog
                      actionsRef={deleteDialogRef}
                    >
                      <DialogTrigger
                        className={buttonVariants({ variant: "destructive", size: "icon" })}
                        aria-label="Delete collection"
                      >
                        <Trash2 />
                      </DialogTrigger>
                      <DialogContent showCloseButton={false}>
                        <DialogHeader>
                          <DialogTitle>
                            Delete "{collection.name}"?
                          </DialogTitle>
                          <DialogDescription>
                            This removes the collection and its study progress. This can't be undone.
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
              <Card className="flex-1">
                <CardContent className="flex size-full flex-col gap-4">
                  <InputGroup className="sm:max-w-sm">
                    <InputGroupAddon>
                      <Search className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="Search words in this collection"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </InputGroup>
                  <WordTable
                    className="w-full flex-1"
                    data={cards}
                    search={search}
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
});
