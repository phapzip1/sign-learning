import React, { useEffect } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { create } from "zustand";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudy, reviewCard } from "@/src/lib/api";
import { RecallRating, RemoteStudy } from "@/src/types/study.type";
import SignDemo from "@/src/components/sign-demo";



type StudyState = {
    state: | "idle" | "loading" | "loaded" | "reviewing" | "error";

    data: RemoteStudy | null;

    revealed: boolean;

    error: string | null;

    setState: (state: StudyState["state"]) => void;
    setData: (data: RemoteStudy | null) => void;
    setRevealed: (revealed: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
};

const useStudy = create<StudyState>()(
    (set) => ({
        state: "idle",

        data: null,

        revealed: false,

        error: null,

        setState: (state) => set({ state }),

        setData: (data) =>
            set({
                data,
                // A new card should always start hidden.
                revealed: false,
            }),

        setRevealed: (revealed) => set({ revealed }),

        setError: (error) => set({ error }),

        reset: () => set({
            state: "idle",
            data: null,
            revealed: false,
            error: null,
        }),
    })
);

const clientEventId = crypto.randomUUID();


const LearnFlashCardPage: React.FC = () => {
    const { getToken } = useAuth();

    const { collectionId: deckId } = Route.useParams();

    const {
        state,
        data: study,
        revealed,
        error,

        setState,
        setData,
        setRevealed,
        setError,
        reset,
    } = useStudy();

    //
    // Load current study state/card.
    //
    const loadStudy = async () => {
        const token = await getToken();

        if (!token) {
            throw new Error(
                "Authentication token unavailable."
            );
        }

        const result = await getStudy(
            deckId,
            token
        );

        setData(result);
    };

    //
    // Initial load.
    //
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setState("loading");
            setError(null);

            try {
                const token = await getToken();

                if (!token) {
                    throw new Error(
                        "Authentication token unavailable."
                    );
                }

                const result = await getStudy(deckId, token);

                if (cancelled)
                    return;

                setData(result);
                setState("loaded");
            }
            catch (error) {
                if (cancelled)
                    return;

                console.error(error);

                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load study card."
                );

                setState("error");
            }
        };

        load();

        return () => {
            cancelled = true;
            reset();
        };
    }, [
        deckId,
        getToken,
        reset,
        setData,
        setError,
        setState,
    ]);

    //
    // Submit rating.
    //
    const handleReview = async (rating: RecallRating) => {
        const card = study?.currentCard;

        if (!card)
            return;

        setState("reviewing");
        setError(null);

        try {
            const token = await getToken();

            if (!token) {
                throw new Error(
                    "Authentication token unavailable."
                );
            }


            //
            // Backend updates:
            // - State
            // - Step
            // - Stability
            // - Difficulty
            // - DueAt
            // - ReviewLog
            //
            await reviewCard(card.id, deckId, { rating: rating, clientEventId: clientEventId }, token);

            //
            // Ask server for the next card.
            //
            // Frontend does not decide whether the next
            // card should be New / Learning / Review.
            //
            const nextStudy = await getStudy(deckId, token);

            setData(nextStudy);

            setState("loaded");
        }
        catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to submit review."
            );

            setState("error");
        }
    };

    if (
        state === "idle" ||
        state === "loading"
    ) {
        return (
            <div className="flex min-h-125 items-center justify-center">
                <p className="text-muted-foreground">
                    Loading study session...
                </p>
            </div>
        );
    }

    if (state === "error") {
        return (
            <div className="flex min-h-125 flex-col items-center justify-center gap-3">
                <h2 className="text-xl font-semibold">
                    Something went wrong
                </h2>

                <p className="text-muted-foreground">
                    {error}
                </p>

                <Button
                    onClick={async () => {
                        setState("loading");
                        setError(null);

                        try {
                            await loadStudy();
                            setState("loaded");
                        }
                        catch (error) {
                            setError(
                                error instanceof Error
                                    ? error.message
                                    : "Unable to load study session."
                            );

                            setState("error");
                        }
                    }}
                >
                    Try again
                </Button>
            </div>
        );
    }

    if (!study) {
        return null;
    }

    //
    // Nothing currently available.
    //
    if (!study.currentCard) {
        return (
            <div className="mx-auto mt-12 w-full max-w-3xl">
                <Card>
                    <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                        <h1 className="text-2xl font-semibold">
                            You're caught up
                        </h1>

                        <p className="text-muted-foreground">
                            There are no cards available to study
                            right now.
                        </p>

                        {study.nextDueAt && (
                            <p className="text-sm text-muted-foreground">
                                Next card due{" "}
                                {new Date(
                                    study.nextDueAt
                                ).toLocaleString()}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    const card = study.currentCard;

    const isReviewing =
        state === "reviewing";

    return (
        <div className="mx-auto mt-8 w-full max-w-3xl px-4">
            <Card className="rounded-lg">
                <CardContent className="flex flex-col gap-6 p-6">

                    {/* Counts */}

                    <div className="grid grid-cols-3 gap-3">

                        <div className="rounded-md border px-4 py-3 text-center">
                            <p className="text-xs text-muted-foreground">
                                New
                            </p>

                            <p className="mt-1 text-lg font-semibold">
                                {study.new}
                            </p>
                        </div>

                        <div className="rounded-md border px-4 py-3 text-center">
                            <p className="text-xs text-muted-foreground">
                                Learning
                            </p>

                            <p className="mt-1 text-lg font-semibold">
                                {study.learning}
                            </p>
                        </div>

                        <div className="rounded-md border px-4 py-3 text-center">
                            <p className="text-xs text-muted-foreground">
                                Due
                            </p>

                            <p className="mt-1 text-lg font-semibold">
                                {study.due}
                            </p>
                        </div>

                    </div>

                    {/* Demo/video */}

                    {card.word.demoURL && (
                        <div className="overflow-hidden rounded-md border">
                            <SignDemo
                                src={card.word.demoURL}
                                className="aspect-video w-full"
                            />
                        </div>
                    )}

                    {/* Hidden state */}

                    {!revealed && (
                        <Button
                            size="lg"
                            className="w-full"
                            onClick={() =>
                                setRevealed(true)
                            }
                        >
                            Reveal answer
                        </Button>
                    )}

                    {/* Revealed state */}

                    {revealed && (
                        <div className="border-t border-dashed pt-6">

                            {/* Answer */}

                            <div className="flex flex-col items-center gap-2 text-center">

                                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                                    Answer
                                </p>

                                <h2 className="text-3xl font-semibold">
                                    {card.word.value}
                                </h2>

                                {card.word.meaning && (
                                    <p className="max-w-xl text-base leading-7 text-muted-foreground">
                                        {card.word.meaning}
                                    </p>
                                )}

                            </div>

                            {/* Instruction */}

                            {card.word.instruction && (
                                <div className="mt-6 rounded-lg border bg-muted/30 p-4">

                                    <p className="mb-1 text-sm font-medium">
                                        Signing tip
                                    </p>

                                    <p className="text-sm leading-6 text-muted-foreground">
                                        {card.word.instruction}
                                    </p>

                                </div>
                            )}

                            {/* Ratings */}

                            <div className="mt-7 border-t pt-5">

                                <div className="mb-4 text-center">

                                    <p className="font-medium">
                                        How well did you remember this?
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Choose the response that best
                                        matches your recall.
                                    </p>

                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                                    <Button
                                        variant="outline"
                                        disabled={isReviewing}
                                        className="h-auto flex-col gap-1 py-3"
                                        onClick={() => handleReview("Again")}
                                    >
                                        <span className="font-semibold">
                                            Again
                                        </span>

                                        <span className="text-xs text-muted-foreground">
                                            Forgot
                                        </span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        disabled={isReviewing}
                                        className="h-auto flex-col gap-1 py-3"
                                        onClick={() => handleReview("Hard")}
                                    >
                                        <span className="font-semibold">
                                            Hard
                                        </span>

                                        <span className="text-xs text-muted-foreground">
                                            Difficult
                                        </span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        disabled={isReviewing}
                                        className="h-auto flex-col gap-1 py-3"
                                        onClick={() => handleReview("Good")}
                                    >
                                        <span className="font-semibold">
                                            Good
                                        </span>

                                        <span className="text-xs text-muted-foreground">
                                            Remembered
                                        </span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        disabled={isReviewing}
                                        className="h-auto flex-col gap-1 py-3"
                                        onClick={() => handleReview("Easy")}
                                    >
                                        <span className="font-semibold">
                                            Easy
                                        </span>

                                        <span className="text-xs text-muted-foreground">
                                            Effortless
                                        </span>
                                    </Button>

                                </div>

                                {isReviewing && (
                                    <p className="mt-3 text-center text-sm text-muted-foreground">
                                        Saving review...
                                    </p>
                                )}

                            </div>

                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
};

export const Route = createFileRoute("/flashcards/$collectionId/learn")({
    component: LearnFlashCardPage,
});
