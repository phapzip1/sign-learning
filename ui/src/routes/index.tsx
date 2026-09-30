import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import {
    ArrowRight,
    Camera,
    Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SignSearch from "@/src/components/sign-seach";
import { MOCKTOPICS } from "@/src/lib/mock";


const DashboardPage: React.FC = () => {
    // const user = useApp((state) => state.user);

    return (
        <div className="w-full flex flex-col gap-4 px-5 mt-6">
            <section className="flex flex-row justify-between gap-4">
                {/* SEARCH BY WORD*/}
                <Card className="rounded flex-1">
                    <CardContent className="flex flex-col gap-3">
                        <div className="flex flex-row items-center gap-4">
                            <Avatar className="flex items-center justify-center size-12">
                                <Search />
                            </Avatar>
                            <span>
                                <h3 className="text-xl font-semibold">Search by word</h3>
                                <p className="text-muted-foreground">Find the meaning, watch the sign and learn with examples</p>
                            </span>
                        </div>
                        <div className="flex flex-row gap-2">
                            <Input
                                placeholder="Type a word (e.g. hello, thank you, ...)"

                            />
                            <Button className="rounded">
                                Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                {/* SEARCH BY SIGN*/}
                <Card className="rounded">
                    <CardContent className="flex flex-col gap-3">
                        <div className="flex flex-row items-center gap-4">
                            <Avatar className="flex items-center justify-center size-12">
                                <Camera />
                            </Avatar>
                            <span>
                                <h3 className="text-xl font-semibold">Search by sign</h3>
                                <p className="text-muted-foreground">Use your camera to find a sign. Show the sign and we help to identify it</p>
                            </span>
                        </div>
                        <div className="size-full flex flex-row gap-2 border-muted-foreground border-dashed">
                            {/* <Button
                                variant="secondary"
                                className="rounded"
                            >
                                Start your camera
                            </Button> */}
                            <ClientOnly>
                                <SignSearch />
                            </ClientOnly>
                        </div>
                    </CardContent>
                </Card>
            </section>
            <section className="flex flex-row gap-4">
                <Card className="rounded flex-5">
                    <CardContent className="flex flex-col gap-2">
                        <div className="flex flex-row items-center gap-4 justify-between">
                            <span>
                                <h3 className="text-xl font-semibold">Explore by topics</h3>
                                <p className="text-muted-foreground">Browse popular topcs to start learning</p>
                            </span>
                            <Link
                                to="/topics"
                                className="flex flex-row gap-1 items-center"

                            >
                                View all topics
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                        <div className="size-full flex flex-row gap-4 border-muted-foreground border-dashed">
                            {           
                                MOCKTOPICS.map((topic) => {
                                    const Icon = topic.icon;
                                    return (
                                        <Link key={topic.id} to={"/topics/" + topic.id} className="block py-2">
                                            <Card id={`${topic.id}`} className="rounded h-full">
                                                <CardContent className="max-w-45 flex flex-col gap-2 items-center">
                                                    <Avatar className="size-14 flex justify-center items-center fill-accent">
                                                        <Icon className="accent-foreground" />
                                                    </Avatar>
                                                    <h3 className="text-lg font-medium">{topic.title}</h3>
                                                    <p className="text-center text-muted-foreground">
                                                        {topic.description}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    );
                                })
                            }
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}

export const Route = createFileRoute("/")({
    component: DashboardPage,
});