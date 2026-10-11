import React from "react";
import { SignInButton, useAuth } from "@clerk/tanstack-react-start";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CloudOff, Layers3, LogIn, Play, Plus, RotateCcw, Settings, Sparkles } from "lucide-react";
import { cn } from "cn";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/src/components/page-header";
import EmptyState from "@/src/components/empty-state";
import { getCollections } from "@/src/lib/api";
import { RemoteCollectionCard } from "@/src/types/collection.type";
import { toApiError } from "@/src/lib/errors";

const CountPill: React.FC<{
  label: string;
  value: number;
  className: string;
}> = ({ label, value, className }) => {
  return (
    <div className={cn("flex flex-1 flex-col items-center rounded-2xl px-3 py-2", className)}>
      <span className="text-2xl font-black leading-tight">{value}</span>
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
}

const CollectionCard: React.FC<{
  collection: RemoteCollectionCard;
}> = ({ collection }) => {
  const navigate = useNavigate();
  const total = collection.new + collection.learning + collection.due;

  return (
    <Card className="transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10" size="sm">
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Layers3 className="size-5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-extrabold">{collection.name}</h3>
              <p className="text-sm text-muted-foreground">
                {total === 0 ? "All done for now 🎉" : `${total} cards to study`}
              </p>
            </div>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Collection settings"
            onClick={() => {
              navigate({
                to: "/me/collections", search: {
                  collection: collection.id,
                }
              })
            }}
          >
            <Settings />
          </Button>
        </div>

        <div className="flex gap-2">
          <CountPill label="New" value={collection.new} className="bg-sky-100 text-sky-700" />
          <CountPill label="Learning" value={collection.learning} className="bg-emerald-100 text-emerald-700" />
          <CountPill label="Due" value={collection.due} className="bg-rose-100 text-rose-700" />
        </div>

        <Button
          className="mt-auto w-full"
          onClick={() => {
            navigate({ to: `/flashcards/${collection.id}/learn` });
          }}
          disabled={total === 0}
        >
          <Play className="fill-current" />
          {total === 0 ? "Nothing due" : "Study now"}
        </Button>
      </CardContent>
    </Card>
  );
}

const FlashCardPage: React.FC = () => {
  const navigate = useNavigate();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [collections, setCollections] = React.useState<RemoteCollectionCard[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchCollections = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const data = await getCollections(`Bearer ${token}`);

      setCollections(data);
    } catch (error) {
      setError(toApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  React.useEffect(() => {
    // Wait for Clerk so signed-out visitors get a sign-in prompt, not an API error.
    if (isLoaded && isSignedIn) {
      fetchCollections();
    }
  }, [isLoaded, isSignedIn, fetchCollections]);

  const goToCollections = () => navigate({ to: "/me/collections", search: { collection: "" } });

  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader
        icon={Sparkles}
        title="Flashcards"
        description="Pick a collection and practice a few signs today."
        actions={
          <Button variant="outline" onClick={goToCollections}>
            <Plus />
            Manage collections
          </Button>
        }
      />

      {
        isLoaded && !isSignedIn ? (
          <EmptyState
            icon={LogIn}
            title="Sign in to study"
            description="Your collections and study progress are saved to your account. Sign in to see them, or keep browsing the dictionary without an account."
            action={
              <SignInButton mode="modal">
                <Button>
                  <LogIn />
                  Sign in
                </Button>
              </SignInButton>
            }
          />
        ) : !isLoaded || loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {
              Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-56 rounded-2xl" />
              ))
            }
          </div>
        ) : error ? (
          <EmptyState
            icon={CloudOff}
            title="Couldn't load your collections"
            description={error}
            action={
              <Button onClick={fetchCollections}>
                <RotateCcw />
                Try again
              </Button>
            }
          />
        ) : collections.length === 0 ? (
          <EmptyState
            icon={Layers3}
            title="No collections yet"
            description="Create a collection and add some signs from the dictionary to start practicing."
            action={
              <Button onClick={goToCollections}>
                <Plus />
                Create a collection
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {
              collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))
            }
          </div>
        )
      }
    </div>
  );
}

export const Route = createFileRoute("/flashcards/")({
  component: FlashCardPage,
  head: () => ({
    meta: [{ title: "Study · Sign Learning" }],
  }),
});
