import { createFileRoute, Link } from "@tanstack/react-router";
import {
    ArrowRight,
    BookOpen,
    Brain,
    Camera,
    Flame,
    Hand,
    Heart,
    Layers3,
    Search,
    Sparkles,
} from "lucide-react";
import { cn } from "cn";

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
    tone: string;
}> = ({ icon: Icon, title, description, tone }) => {
    return (
        <Card className="transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
            <CardHeader>
                <div className={cn("mb-3 flex size-12 items-center justify-center rounded-2xl", tone)}>
                    <Icon className="size-6" />
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

const steps = [
    {
        icon: Search,
        title: "Find a sign",
        description: "Search by word or simply sign in front of your camera.",
    },
    {
        icon: Heart,
        title: "Save it",
        description: "Add the signs you like to your own collections.",
    },
    {
        icon: Flame,
        title: "Practice daily",
        description: "Short flashcard sessions keep your streak going.",
    },
];

const DashboardPage: React.FC = () => {
    return (
        <div className="flex w-full flex-col gap-20 pb-8">
            {/* Hero */}
            <section className="relative isolate grid items-center gap-12 pt-6 lg:grid-cols-2 lg:pt-12">
                <div className="pointer-events-none absolute -top-20 -left-20 -z-10 size-96 rounded-full bg-primary/15 blur-3xl" />

                <div className="flex flex-col items-start">
                    <div className="mb-6 flex items-center gap-2 rounded-full bg-highlight/30 px-4 py-1.5 text-sm font-semibold text-highlight-foreground">
                        <Sparkles className="size-4" />
                        Learn sign language at your own pace
                    </div>

                    <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                        Learn signs.
                        <br />
                        <span className="text-primary">Remember</span> them.
                        <br />
                        Use them{" "}
                        <span className="relative whitespace-nowrap">
                            <span className="absolute inset-x-0 bottom-1 -z-10 h-4 rounded-full bg-highlight/70 sm:h-5" />
                            confidently.
                        </span>
                    </h1>

                    <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                        Build your sign language vocabulary with visual examples,
                        organized collections, and spaced repetition designed to help you
                        remember what you learn.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <Button
                            size="lg"
                            variant="highlight"
                            render={
                                <Link to="/dictionary">
                                    <BookOpen className="size-5" />
                                    Start Learning
                                </Link>
                            }
                        />
                        <Button
                            size="lg"
                            variant="outline"
                            render={
                                <Link to="/flashcards">
                                    <Layers3 className="size-5" />
                                    Practice flashcards
                                </Link>
                            }
                        />
                    </div>
                </div>

                {/* Visual */}
                <div className="relative hidden lg:block">
                    <div className="absolute inset-6 rounded-full bg-highlight/40 blur-3xl" />

                    <div className="relative mx-auto flex aspect-square max-w-md items-center justify-center rounded-[3rem] bg-linear-to-br from-primary to-violet-400 shadow-2xl shadow-primary/30">
                        <div className="flex size-52 items-center justify-center rounded-full bg-white/15 ring-8 ring-white/10">
                            <Hand
                                strokeWidth={1.4}
                                className="size-28 text-white -rotate-12"
                            />
                        </div>

                        <div className="absolute -left-6 top-12 flex items-center gap-3 rounded-2xl bg-card p-4 shadow-lg -rotate-3">
                            <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                                <Layers3 className="size-5" />
                            </span>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground">
                                    New today
                                </p>
                                <p className="text-xl font-extrabold">
                                    12 cards
                                </p>
                            </div>
                        </div>

                        <div className="absolute -right-6 bottom-12 flex items-center gap-3 rounded-2xl bg-card p-4 shadow-lg rotate-3">
                            <span className="flex size-10 items-center justify-center rounded-xl bg-highlight/40 text-highlight-foreground">
                                <Flame className="size-5" />
                            </span>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground">
                                    Current streak
                                </p>
                                <p className="text-xl font-extrabold">
                                    7 days
                                </p>
                            </div>
                        </div>

                        <div className="absolute -bottom-5 left-10 flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-lg">
                            <Camera className="size-4 text-primary" />
                            Search by signing
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section>
                <div className="mb-10 max-w-2xl">
                    <p className="text-sm font-bold text-primary">
                        A better way to practice
                    </p>

                    <h2 className="mt-2 text-3xl font-extrabold">
                        Everything you need to keep learning
                    </h2>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                    <FeatureCard
                        icon={Hand}
                        tone="bg-secondary text-primary"
                        title="Visual vocabulary"
                        description="Learn each sign with demonstrations, meanings, and clear instructions."
                    />

                    <FeatureCard
                        icon={Layers3}
                        tone="bg-highlight/40 text-highlight-foreground"
                        title="Personal collections"
                        description="Organize words into collections and focus on the vocabulary that matters to you."
                    />

                    <FeatureCard
                        icon={Brain}
                        tone="bg-emerald-100 text-emerald-700"
                        title="Spaced repetition"
                        description="Review cards at the right time so difficult signs appear more often."
                    />
                </div>
            </section>

            {/* How it works */}
            <section className="rounded-3xl bg-secondary/60 px-6 py-12 sm:px-10">
                <h2 className="text-center text-3xl font-extrabold">
                    How it works
                </h2>

                <div className="mt-10 grid gap-8 md:grid-cols-3">
                    {
                        steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div key={step.title} className="flex flex-col items-center text-center">
                                    <div className="relative">
                                        <div className="flex size-16 items-center justify-center rounded-3xl bg-card text-primary shadow-sm">
                                            <Icon className="size-7" />
                                        </div>
                                        <span className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-highlight text-sm font-extrabold text-highlight-foreground">
                                            {index + 1}
                                        </span>
                                    </div>
                                    <h3 className="mt-4 text-lg font-bold">
                                        {step.title}
                                    </h3>
                                    <p className="mt-1 max-w-xs text-muted-foreground">
                                        {step.description}
                                    </p>
                                </div>
                            );
                        })
                    }
                </div>
            </section>

            {/* CTA */}
            <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary to-violet-500 px-6 py-16 text-center text-primary-foreground shadow-xl shadow-primary/20">
                <div className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-highlight/40 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-10 size-64 rounded-full bg-white/10 blur-2xl" />

                <div className="relative flex flex-col items-center">
                    <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-white/20">
                        <Hand className="size-7" />
                    </div>

                    <h2 className="text-3xl font-extrabold">
                        Ready to start learning?
                    </h2>

                    <p className="mt-3 max-w-lg text-primary-foreground/85">
                        Explore the dictionary, create a collection, and start building your
                        sign language vocabulary.
                    </p>

                    <Button
                        className="mt-7"
                        size="lg"
                        variant="highlight"
                        render={
                            <Link to="/flashcards">
                                Start Learning
                                <ArrowRight className="size-5" />
                            </Link>
                        }
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="flex flex-col items-center justify-between gap-2 border-t pt-6 sm:flex-row">
                <div className="flex items-center gap-2 font-bold">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Hand className="size-4" />
                    </span>
                    Sign Learning
                </div>

                <p className="text-sm text-muted-foreground">
                    Learn one sign at a time. 👋
                </p>
            </footer>
        </div>
    );
}

export const Route = createFileRoute("/")({
    component: DashboardPage,
});
