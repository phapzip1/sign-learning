/**
 * Study session (/flashcards/:collectionId/learn): sign-first flashcards. Shows the
 * sign, reveals the answer on request, then submits a rating; the server picks the next
 * card. Shortcuts: Space/Enter reveal, 1–4 rate (ignored while typing or on controls).
 */

import React, { useEffect } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
    ArrowLeft,
    Clock,
    CloudOff,
    Eye,
    Layers3,
    Lightbulb,
    Loader2,
    RotateCcw,
} from "lucide-react";
import { cn } from "cn";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getStudy, reviewCard } from "@/src/lib/api";
import { RecallRating, RemoteStudy } from "@/src/types/study.type";
import SignDemo from "@/src/components/sign-demo";
import EmptyState from "@/src/components/empty-state";

/** The four rating buttons, their keyboard shortcuts and labels. */
const RATINGS: {
    rating: RecallRating;
    key: string;
    emoji: string;
    hint: string;
    className: string;
}[] = [
        { rating: "Again", key: "1", emoji: "😵", hint: "Forgot", className: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800" },
        { rating: "Hard", key: "2", emoji: "😅", hint: "Difficult", className: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800" },
        { rating: "Good", key: "3", emoji: "🙂", hint: "Remembered", className: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800" },
        { rating: "Easy", key: "4", emoji: "🤩", hint: "Effortless", className: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800" },
    ];

/** Keyboard key hint. */
const Kbd: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <kbd className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-b-2 bg-card px-1 font-sans text-[0.7rem] font-bold text-muted-foreground", className)}>
        {children}
    </kbd>
);

const BackLink: React.FC = () => (
    <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        render={
            <Link to="/flashcards">
                <ArrowLeft />
                Collections
            </Link>
        }
    />
);



type StudyPhase = "idle" | "loading" | "loaded" | "reviewing" | "error";

// Space/Enter activate whatever control has focus (buttons, links, media
// controls), so the reveal shortcut only applies when nothing interactive is focused.
const INTERACTIVE = "a, button, input, textarea, select, summary, video, audio, iframe, [contenteditable=true], [role=button], [role=slider], [role=radio], [role=checkbox], [role=tab], [role=menuitem]";
const TEXT_ENTRY = "input, textarea, select, [contenteditable=true]";

const LearnFlashCardPage: React.FC = () => {
    const { getToken } = useAuth();

    const { collectionId: deckId } = Route.useParams();

    // Session-only UI state; the card data itself always comes from the server.
    const [state, setState] = React.useState<StudyPhase>("idle");
    const [study, setStudy] = React.useState<RemoteStudy | null>(null);
    const [revealed, setRevealed] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const setData = React.useCallback((data: RemoteStudy | null) => {
        setStudy(data);
        // A new card should always start hidden.
        setRevealed(false);
    }, []);

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
        };
    }, [
        deckId,
        getToken,
        setData,
    ]);

    //
    // Submit rating.
    //
    // Guards against a second rating (double click / repeated key) landing
    // before the "reviewing" state has re-rendered.
    const submittingRef = React.useRef(false);

    const handleReview = async (rating: RecallRating) => {
        const card = study?.currentCard;

        if (!card || submittingRef.current)
            return;

        submittingRef.current = true;

        // The backend de-duplicates reviews by (clientEventId, cardId), so every
        // rating needs its own id; reusing one would drop later ratings of a card
        // that comes back in the same session.
        const clientEventId = crypto.randomUUID();

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
        finally {
            submittingRef.current = false;
        }
    };

    //
    // Keyboard shortcuts: Space/Enter reveals, 1-4 rates.
    //
    const shortcutRef = React.useRef<(e: KeyboardEvent) => void>(() => { });

    shortcutRef.current = (e: KeyboardEvent) => {
        if (e.repeat || e.altKey || e.ctrlKey || e.metaKey)
            return;

        const target = e.target instanceof Element ? e.target : null;

        if (target?.closest(TEXT_ENTRY))
            return;

        if (state !== "loaded" || !study?.currentCard)
            return;

        if (!revealed) {
            if ((e.key === " " || e.key === "Enter") && !target?.closest(INTERACTIVE)) {
                e.preventDefault();
                setRevealed(true);
            }
            return;
        }

        const rating = RATINGS.find((r) => r.key === e.key);

        if (rating) {
            e.preventDefault();
            handleReview(rating.rating);
        }
    };

    useEffect(() => {
        const listener = (e: KeyboardEvent) => shortcutRef.current(e);

        window.addEventListener("keydown", listener);

        return () => window.removeEventListener("keydown", listener);
    }, []);

    if (
        state === "idle" ||
        state === "loading"
    ) {
        return (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                <Skeleton className="h-8 w-40" />
                <div className="grid grid-cols-3 gap-3">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                </div>
                <Skeleton className="aspect-video w-full rounded-3xl" />
                <p className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Getting your cards ready…
                </p>
            </div>
        );
    }

    if (state === "error") {
        return (
            <div className="mx-auto w-full max-w-3xl">
                <EmptyState
                    icon={CloudOff}
                    title="Something went wrong"
                    description={error}
                    action={
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
                            <RotateCcw />
                            Try again
                        </Button>
                    }
                />
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
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                <BackLink />
                <Card className="relative overflow-hidden">
                    <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-highlight/40 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-16 -left-16 size-56 rounded-full bg-primary/20 blur-3xl" />
                    <CardContent className="relative flex flex-col items-center gap-3 py-12 text-center">
                        <span className="text-6xl">🎉</span>
                        <h1 className="text-3xl font-black">
                            You're all caught up!
                        </h1>

                        <p className="max-w-md text-muted-foreground">
                            Great work. There are no cards to study in this
                            collection right now, so come back later for more practice.
                        </p>

                        {study.nextDueAt && (
                            <p className="flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground">
                                <Clock className="size-4" />
                                Next card due{" "}
                                {new Date(
                                    study.nextDueAt
                                ).toLocaleString()}
                            </p>
                        )}

                        <Button
                            className="mt-4"
                            render={
                                <Link to="/flashcards">
                                    <Layers3 />
                                    Back to collections
                                </Link>
                            }
                        />
                    </CardContent>
                </Card>
            </div>
        );
    }

    const card = study.currentCard;

    const isReviewing =
        state === "reviewing";

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
                <BackLink />

                {/* Counts */}
                <div className="flex gap-2">
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-bold text-sky-700">
                        {study.new} new
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                        {study.learning} learning
                    </span>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-bold text-rose-700">
                        {study.due} due
                    </span>
                </div>
            </div>

            <Card className="rounded-3xl shadow-lg shadow-primary/10">
                <CardContent className="flex flex-col gap-6">

                    <p className="text-center text-sm font-bold text-primary">
                        What does this sign mean?
                    </p>

                    {/* Demo/video */}

                    {card.word.demoURL && (
                        <div className="overflow-hidden rounded-2xl bg-black">
                            <SignDemo
                                src={card.word.demoURL}
                                className="aspect-video w-full"
                            />
                        </div>
                    )}

                    {/* Hidden state */}

                    {!revealed && (
                        <div className="flex flex-col items-center gap-2">
                            <Button
                                size="lg"
                                variant="highlight"
                                className="w-full"
                                onClick={() =>
                                    setRevealed(true)
                                }
                            >
                                <Eye />
                                Reveal answer
                            </Button>
                            <p className="hidden text-xs text-muted-foreground sm:block">
                                Tip: press <Kbd>Space</Kbd> to reveal
                            </p>
                        </div>
                    )}

                    {/* Revealed state */}

                    {revealed && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 border-t-2 border-dashed pt-6 duration-300">

                            {/* Answer */}

                            <div className="flex flex-col items-center gap-2 text-center">

                                <p className="text-xs font-bold text-muted-foreground">
                                    Answer
                                </p>

                                <h2 className="text-4xl font-black text-primary">
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
                                <div className="mt-6 flex gap-3 rounded-2xl bg-highlight/15 p-4 ring-1 ring-highlight/40">
                                    <Lightbulb className="mt-0.5 size-5 shrink-0 text-highlight-foreground" />
                                    <div>
                                        <p className="mb-1 text-sm font-bold">
                                            Signing tip
                                        </p>

                                        <p className="text-sm leading-6 text-muted-foreground">
                                            {card.word.instruction}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Ratings */}

                            <div className="mt-7 border-t pt-5">

                                <div className="mb-4 text-center">

                                    <p className="font-bold">
                                        How well did you remember this?
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Be honest, because it helps us show you the sign at the right time.
                                    </p>

                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {
                                        RATINGS.map((r) => (
                                            <Button
                                                key={r.rating}
                                                variant="outline"
                                                disabled={isReviewing}
                                                className={cn("relative h-auto flex-col gap-0.5 rounded-2xl border-2 py-3", r.className)}
                                                onClick={() => handleReview(r.rating)}
                                            >
                                                <span className="text-xl leading-none">
                                                    {r.emoji}
                                                </span>
                                                <span className="font-bold">
                                                    {r.rating}
                                                </span>

                                                <span className="text-xs font-medium opacity-80">
                                                    {r.hint}
                                                </span>
                                                <Kbd className="absolute top-1.5 right-1.5 hidden sm:inline-flex">
                                                    {r.key}
                                                </Kbd>
                                            </Button>
                                        ))
                                    }
                                </div>

                                {isReviewing && (
                                    <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="size-4 animate-spin" />
                                        Saving review…
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
    head: () => ({
        meta: [{ title: "Study session · Sign Learning" }],
    }),
});
