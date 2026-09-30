import React from "react";
import { Heart, List } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import SignDemo from "@/src/components/sign-demo";
import { Button } from "@/components/ui/button";
import { getWord } from "@/src/lib/api";
import AddToCollectionButton from "@/src/components/add-to-collection-button";

const WordDetailPage: React.FC = () => {
    const word = Route.useLoaderData();

    return (
        <div className="flex flex-col gap-4 w-full">
            <h2 className="text-4xl font-semibold">{ }</h2>
            <div className="flex flex-row justify-between gap-40">
                <p>
                    <span className="font-semibold">Definition:</span>
                    {" "}
                    {word.description}
                </p>
                <img
                    className="w-100 aspect-video object-contain"
                    src={word.cover}
                />
            </div>
            <div className="flex flex-row gap-2">

            </div>
            <div className="flex flex-row gap-8">
                <SignDemo
                    className="flex-3"
                    src={word.demo}

                />
                <div className="flex flex-col flex-2 justify-between">
                    <div className="flex flex-col">
                        <span className="flex flex-row gap-2 items-center h-fit">
                            <List />
                            <h3 className="text-xl font-medium">Instruction</h3>
                        </span>
                        <div className="flex flex-col gap-4 pt-4">
                            {
                                word.instruction
                            }
                        </div>
                    </div>

                    <AddToCollectionButton
                        wordId={word.id}
                        trigger={
                            <Button
                                variant="outline"
                                className="flex flex-row"
                            >
                                <Heart />
                                Add to a collection
                            </Button>
                        }
                    />
                </div>
            </div>
            <h3 className="text-xl font-medium">Related words</h3>
            <div className="flex flex-row gap-4">
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
            <div className="p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
        );
    }
});