import React from "react";
import { ArrowLeft, Heart, Lightbulb } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import SignDemo from "@/src/components/sign-demo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getWord } from "@/src/lib/api";
import AddToCollectionButton from "@/src/components/add-to-collection-button";
import LevelBadge from "@/src/components/level-badge";
import { Show } from "@clerk/tanstack-react-start";

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
                            alt={word.title}
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
                </div>
            </div>
        </div>
    );
}

export const Route = createFileRoute("/dictionary/$wordId")({
    component: WordDetailPage,
    loader: async ({ params }) => {
        const { wordId } = params;
        const post = await getWord(wordId);
        return post;
    },
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
