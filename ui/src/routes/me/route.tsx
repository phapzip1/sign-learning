import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { BarChart3, Layers3, Lightbulb, UserRound } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";
import PageHeader from "@/src/components/page-header";

const tabs = [
    {
        path: "/",
        label: "Overview",
        icon: BarChart3,
    },
    {
        path: "/collections",
        label: "Collections",
        icon: Layers3,
    },
    {
        path: "/suggestions",
        label: "Suggestions",
        icon: Lightbulb,
    }
];

const getLastSegment = (url: string) => {
    const path = url.replace(/\/+$/, "");
    const segment = path.substring(path.lastIndexOf('/') + 1)
    return segment === "me" ? "/" : "/" + segment;
}

const MeRootLayout: React.FC = () => {
    const navigate = useNavigate();
    const pathname = useLocation({ select: (location) => location.pathname });
    const tab = getLastSegment(pathname);

    return (
        <div className="flex w-full flex-col gap-6">
            <PageHeader
                icon={UserRound}
                title="Your space"
                description="Track your progress, organize collections, and share word ideas."
            />
            <Tabs
                value={tab}
                onValueChange={(value: string) => {
                    navigate({ to: `/me${value}` });
                }}
            >
                <TabsList className="h-11 max-w-full overflow-x-auto">
                    {
                        tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <TabsTrigger key={tab.path} value={tab.path} className="px-4">
                                    <Icon className="size-4" />
                                    {tab.label}
                                </TabsTrigger>
                            );
                        })
                    }
                </TabsList>
            </Tabs>
            <Outlet />
        </div>
    );
}

export const Route = createFileRoute("/me")({
    component: MeRootLayout,
    head: () => ({
        meta: [{ title: "Your space · Sign Learning" }],
    }),
});
