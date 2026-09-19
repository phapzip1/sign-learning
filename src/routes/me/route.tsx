import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";

const tabs = [
    {
        path: "/",
        label: "Overview",
    },
    {
        path: "/collections",
        label: "Collections"
    },
    {
        path: "/suggestions",
        label: "Suggestions"
    }
];

const getLastSegment = (url: string) => {
    const segment = url.substring(url.lastIndexOf('/') + 1)
    return segment === "me" ? "/" : "/" + segment;
}

const MeRootLayout: React.FC = () => {
    const navigate = useNavigate();
    const [tab, setTab] = React.useState(getLastSegment(window.location.href));

    React.useEffect(() => {
        navigate({ to: `/me${tab}` });
    }, [tab, navigate]);


    return (
        <div className="flex flex-col gap-4 w-full">
            <Tabs
                value={tab}
                onValueChange={setTab}
            >
                <TabsList
                    variant="line"
                >
                    {
                        tabs.map((tab) => {
                            return (
                                <TabsTrigger key={tab.path} value={tab.path}>{tab.label}</TabsTrigger>
                            );
                        })
                    }
                </TabsList>
                <Outlet />
            </Tabs>
        </div>
    );
}

export const Route = createFileRoute("/me")({
    component: MeRootLayout,
});

