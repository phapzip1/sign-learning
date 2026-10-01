import { createFileRoute, Link } from "@tanstack/react-router";
import {
    BookOpen,
    Brain,
    Hand,
    Layers3,
    Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import React from "react";


const FeatureCard: React.FC<{
    icon: React.ComponentType<{
        className?: string;
    }>;
    title: string;
    description: string;
}> = ({ icon: Icon, title, description, }) => {
    return (
        <Card className="shadow-none">
            <CardHeader>
                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-muted">
                    <Icon className="size-5" />
                </div>

                <CardTitle className="text-xl">
                    {title}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <p className="leading-7 text-muted-foreground">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

const DashboardPage: React.FC = () => {
    return (
        <main className="min-h-screen bg-background">
            {/* Hero */}
            <section className="mx-auto flex min-h-[75vh] max-w-7xl items-center px-6 py-20">
                <div className="grid w-full items-center gap-12 lg:grid-cols-2">
                    <div className="flex flex-col items-start">
                        <div className="mb-5 flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
                            <Sparkles className="size-4" />
                            Learn sign language at your own pace
                        </div>

                        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                            Learn signs.
                            <br />
                            Remember them.
                            <br />
                            <span className="text-muted-foreground">
                                Use them confidently.
                            </span>
                        </h1>

                        <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                            Build your sign language vocabulary with visual examples,
                            organized decks, and spaced repetition designed to help you
                            remember what you learn.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button size="lg" render={
                                <Link to="/dictionary">
                                    <BookOpen className="mr-2 size-4" />
                                    Start Learning
                                </Link>
                            }>

                            </Button>

                            {/* <Button
                                size="lg"
                                variant="outline"
                                render={
                                    <Link to="/decks">
                                        <Layers3 className="mr-2 size-4" />
                                        View Decks
                                    </Link>
                                }
                            >

                            </Button> */}
                        </div>
                    </div>

                    {/* Visual */}
                    <div className="relative hidden lg:block">
                        <div className="absolute -inset-10 rounded-full bg-muted/40 blur-3xl" />

                        <div className="relative mx-auto flex aspect-square max-w-md items-center justify-center rounded-[2.5rem] border bg-card shadow-sm">
                            <div className="flex size-48 items-center justify-center rounded-full border bg-muted/40">
                                <Hand
                                    strokeWidth={1.4}
                                    className="size-24"
                                />
                            </div>

                            <div className="absolute left-4 top-10 rounded-xl border bg-background p-4 shadow-sm">
                                <p className="text-xs text-muted-foreground">
                                    New
                                </p>

                                <p className="mt-1 text-xl font-semibold">
                                    12 cards
                                </p>
                            </div>

                            <div className="absolute bottom-10 right-2 rounded-xl border bg-background p-4 shadow-sm">
                                <p className="text-xs text-muted-foreground">
                                    Current streak
                                </p>

                                <p className="mt-1 text-xl font-semibold">
                                    7 days
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="border-y bg-muted/20">
                <div className="mx-auto max-w-7xl px-6 py-20">
                    <div className="mb-10 max-w-2xl">
                        <p className="text-sm font-medium text-muted-foreground">
                            A better way to practice
                        </p>

                        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                            Everything you need to keep learning
                        </h2>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                        <FeatureCard
                            icon={Hand}
                            title="Visual vocabulary"
                            description="Learn each sign with demonstrations, meanings, and clear instructions."
                        />

                        <FeatureCard
                            icon={Layers3}
                            title="Personal decks"
                            description="Organize words into decks and focus on the vocabulary that matters to you."
                        />

                        <FeatureCard
                            icon={Brain}
                            title="Spaced repetition"
                            description="Review cards at the right time so difficult signs appear more often."
                        />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="mx-auto max-w-7xl px-6 py-24">
                <div className="flex flex-col items-center rounded-3xl border bg-card px-6 py-16 text-center shadow-sm">
                    <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-muted">
                        <Hand className="size-7" />
                    </div>

                    <h2 className="text-3xl font-semibold tracking-tight">
                        Ready to start learning?
                    </h2>

                    <p className="mt-3 max-w-lg text-muted-foreground">
                        Explore the dictionary, create a deck, and start building your
                        sign language vocabulary.
                    </p>

                    <Button
                        className="mt-7"
                        size="lg"
                        render={
                            <Link to="/flashcards">
                                Start Learning
                            </Link>
                        }
                    >
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
                    <div className="flex items-center gap-2 font-medium">
                        <Hand className="size-5" />
                        Sign Learning
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Learn one sign at a time.
                    </p>
                </div>
            </footer>
        </main>
    );
}

export const Route = createFileRoute("/")({
    component: DashboardPage,
});