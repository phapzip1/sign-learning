import React from "react";
import { ArrowLeft, CloudOff, Heart, Lightbulb, LogIn, SearchX } from "lucide-react";
import { createFileRoute, ErrorComponentProps, Link, notFound, useRouter } from "@tanstack/react-router";
import SignDemo from "@/src/components/sign-demo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getWord } from "@/src/lib/api";
import AddToCollectionButton from "@/src/components/add-to-collection-button";
import LevelBadge from "@/src/components/level-badge";
import { Show, SignInButton } from "@clerk/tanstack-react-start";
import EmptyState from "@/src/components/empty-state";
import RelatedWords from "@/src/components/related-words";
import { isNotFound, toApiError } from "@/src/lib/errors";

const BackLink: React.FC = () => (
    <Button
        variant="ghost"
        size="sm"
        className="w-fit -ml-2 text-muted-foreground"
        render={
            <Link to="/dictionary">
                <ArrowLeft />
                Back to dictionary
            </Link>
        }
    />
);

const WordDetailPage: React.FC = () => {
    const word = Route.useLoaderData();

    return (
        <div className="flex w-full flex-col gap-6">
            <BackLink />

            <div className="flex flex-col-reverse gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {word.topic.id !== 999 && (
                            <Badge variant="secondary">
                                {word.topic.value}
                            </Badge>
                        )}
                        {word.level && <LevelBadge level={word.level} />}
                    </div>
                    <h1 className="text-4xl font-black sm:text-5xl">
                        {word.title.charAt(0).toUpperCase() + word.title.slice(1)}
                    </h1>
                    <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                        {word.description}
                    </p>
                </div>
                {word.cover && (
                    <div className="w-full shrink-0 overflow-hidden rounded-2xl bg-linear-to-br from-secondary to-highlight/20 md:w-80">
                        <img
                            className="aspect-video w-full object-contain"
                            src={word.cover}
                            alt={`Illustration of the sign for "${word.title}"`}
                        />
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                <Card className="p-0">
                    <SignDemo
                        className="overflow-hidden rounded-2xl bg-black"
                        src={word.demo}
                    />
                </Card>

                <div className="flex flex-col gap-4">
                    <Card className="h-full bg-highlight/15 ring-highlight/40" size="sm">
                        <CardContent className="flex flex-col gap-3">
                            <span className="flex items-center gap-2">
                                <span className="flex size-9 items-center justify-center rounded-xl bg-highlight/50 text-highlight-foreground">
                                    <Lightbulb className="size-5" />
                                </span>
                                <h2 className="text-lg font-extrabold">How to sign it</h2>
                            </span>
                            <div className="flex flex-col gap-4 leading-7 whitespace-pre-line">
                                {
                                    word.instruction || (
                                        <span className="text-muted-foreground">
                                            Watch the video and copy the hand shape and movement.
                                        </span>
                                    )
                                }
                            </div>
                        </CardContent>
                    </Card>

                    <Show when="signed-in">
                        <AddToCollectionButton
                            wordId={word.id}
                            trigger={
                                <Button
                                    size="lg"
                                    className="w-full"
                                >
                                    <Heart />
                                    Add to a collection
                                </Button>
                            }
                        />
                    </Show>
                    <Show when="signed-out">
                        <Card size="sm">
                            <CardContent className="flex flex-col gap-3">
                                <p className="text-sm text-muted-foreground">
                                    Sign in to save this sign to one of your collections and practise it later.
                                </p>
                                {/* Modal sign-in keeps the learner on this word afterwards. */}
                                <SignInButton mode="modal">
                                    <Button size="lg" variant="outline" className="w-full">
                                        <LogIn />
                                        Sign in to save
                                    </Button>
                                </SignInButton>
                            </CardContent>
                        </Card>
                    </Show>
                </div>
            </div>

            <RelatedWords wordId={word.id} topic={word.topic} />
        </div>
    );
}

const WordNotFound: React.FC = () => (
    <div className="flex w-full flex-col gap-6">
        <BackLink />
        <EmptyState
            icon={SearchX}
            title="We couldn't find that sign"
            description="It may have been removed, or the link might be wrong. Try searching the dictionary instead."
        />
    </div>
);

const WordError: React.FC<ErrorComponentProps> = ({ error }) => {
    const router = useRouter();

    return (
        <div className="flex w-full flex-col gap-6">
            <BackLink />
            <EmptyState
                icon={CloudOff}
                title="Couldn't load this sign"
                description={toApiError(error).message}
                action={<Button onClick={() => router.invalidate()}>Try again</Button>}
            />
        </div>
    );
}

export const Route = createFileRoute("/dictionary/$wordId")({
    component: WordDetailPage,
    loader: async ({ params }) => {
        try {
            return await getWord(params.wordId);
        } catch (error) {
            if (isNotFound(error)) {
                throw notFound();
            }

            throw error;
        }
    },
    head: ({ loaderData }) => ({
        meta: [{ title: loaderData ? `${loaderData.title} · Sign Learning` : "Sign · Sign Learning" }],
    }),
    notFoundComponent: WordNotFound,
    errorComponent: WordError,
    pendingComponent: () => {

        return (
            <div className="flex w-full flex-col gap-6">
                <Skeleton className="h-8 w-40" />
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-12 w-1/3" />
                    <Skeleton className="h-5 w-2/3" />
                </div>
                <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                    <Skeleton className="aspect-video w-full rounded-2xl" />
                    <Skeleton className="h-64 w-full rounded-2xl" />
                </div>
            </div>
        );
    }
});
