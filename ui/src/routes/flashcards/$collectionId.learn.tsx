import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SignDemo from "@/src/components/sign-demo";


const LearnFlashCardPage: React.FC = () => {
    const [revealed, setRevealed] = React.useState(false);

    return (
        <div className="flex flex-row gap-4 mt-5 mx-auto w-[80%] max-w-200 max-h-200">
            <Card className="w-full">
                <CardContent className="flex flex-col gap-4 h-full">
                    <div className="flex flex-row justify-between items-center-safe">
                        <span>New words: <span className="font-semibold text-blue-500">{2}</span></span>
                        <span>Learning words: <span className="font-semibold text-green-500">{2}</span></span>
                        <span>Due words: <span className="font-semibold text-red-500">{2}</span></span>
                    </div>
                    <SignDemo
                        src="https://youtu.be/ADKCs7KeoHA?list=RD6uVJqD2hSGQ"
                    />
                    {
                        revealed &&
                        <>
                            <Separator className="my-4 bg-transparent border-t border-dashed border-black" />
                            <h3 className="text-2xl font-semibold self-center-safe">Hello</h3>
                            <p>Description</p>
                        </>
                    }
                    <div className="flex flex-col mt-auto pb-2 w-full">
                        <Separator className="my-4 bg-transparent border-t border-dashed border-black" />
                        <div className="flex flex-row justify-between gap-4">
                            {
                                revealed ?
                                    <>
                                        <Button
                                            className="bg-green-600 hover:bg-green-300 flex-1 py-6 text-lg"
                                        >
                                            Easy
                                        </Button>
                                        <Button
                                            className="bg-red-600 hover:bg-red-300 flex-1 py-6 text-lg"
                                        >
                                            Hard
                                        </Button>
                                    </>
                                    :
                                    <Button
                                        className="flex-1 py-6 text-lg"
                                        onClick={() => setRevealed(prev => !prev)}
                                    >
                                        Reveal
                                    </Button>
                            }
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export const Route = createFileRoute("/flashcards/$collectionId/learn")({
    component: LearnFlashCardPage,
})
