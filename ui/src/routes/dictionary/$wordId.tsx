import { Heart, List } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MOCKWORDS } from "@/src/lib/mock";
import SignDemo from "@/src/components/sign-demo";
import { Button } from "@/components/ui/button";
import WordCard from "@/src/components/word-card";

const WordDetailPage: React.FC = () => {
    const word = MOCKWORDS[0];

    return (
        <div className="flex flex-col gap-4 w-full">
            <h2 className="text-4xl font-semibold">Thank you</h2>
            <div className="flex flex-row gap-2">
                <Badge>Emotions</Badge>
                <Badge>Flex</Badge>
                <Badge></Badge>
            </div>
            <div className="flex flex-row gap-8">
                <SignDemo
                    className="flex-3"
                    src={word.video}

                />
                <div className="flex flex-col flex-2 justify-between">
                    <div className="flex flex-col">
                        <span className="flex flex-row gap-2 items-center h-fit">
                            <List />
                            <h3 className="text-xl font-medium">Instruction</h3>
                        </span>
                        <div className="flex flex-col gap-4 pt-4">
                            {
                                word.instruction.map((instruction, index) => {

                                    return (
                                        <Card key={index} className="rounded p-0 min-h-18">
                                            <CardContent className="flex flex-row gap-2 px-3 py-1 items-center-safe">
                                                <Avatar className="flex items-center justify-center size-15 text-xl font-medium">
                                                    {index + 1}
                                                </Avatar>
                                                <p >{instruction}</p>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            }
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="flex flex-row"
                    >
                        <Heart />
                        Add to favorite
                    </Button>
                </div>
            </div>
            <h3 className="text-xl font-medium">Related words</h3>
            <div className="flex flex-row gap-4">
                {
                    MOCKWORDS.map((word) => {

                        return (
                            <WordCard
                                id={word.id}
                                title={word.title}
                                description={word.description}
                                thumbnail={word.video}
                            />
                        );
                    })   
                }
            </div>
        </div>
    );
}

export const Route = createFileRoute("/dictionary/$wordId")({
    component: WordDetailPage,
});