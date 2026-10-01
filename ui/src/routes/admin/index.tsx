import {
    createFileRoute,
} from "@tanstack/react-router";

import {
    Lightbulb,
    LibraryBig,
    Users,
} from "lucide-react";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import React from "react";
import UsersTab from "@/src/components/users-tab";
import { WordsTab } from "@/src/components/word-tab";
import SuggestionsTab from "@/src/components/suggestions-tab";

const AdminPage: React.FC = () => {
    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">

            <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                    Admin
                </h1>

                <p className="mt-1 text-muted-foreground">
                    Manage word suggestions,
                    dictionary words, and users.
                </p>
            </div>

            <Tabs
                defaultValue="suggestions"
                className="w-full"
            >
                <TabsList>
                    <TabsTrigger value="suggestions">
                        <Lightbulb className="mr-2 size-4" />

                        Suggestions
                    </TabsTrigger>

                    <TabsTrigger value="words">
                        <LibraryBig className="mr-2 size-4" />

                        Words
                    </TabsTrigger>

                    <TabsTrigger value="users">
                        <Users className="mr-2 size-4" />

                        Users
                    </TabsTrigger>
                </TabsList>

                <TabsContent
                    value="suggestions"
                    className="mt-4"
                >
                    <SuggestionsTab />
                </TabsContent>

                <TabsContent
                    value="words"
                    className="mt-4"
                >
                    <WordsTab />
                </TabsContent>

                <TabsContent
                    value="users"
                    className="mt-4"
                >
                    <UsersTab />
                </TabsContent>
            </Tabs>

        </div>
    );
}

export const Route = createFileRoute("/admin/")({
    component: AdminPage,
});