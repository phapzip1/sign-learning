// src/routes/__root.tsx
/// <reference types="vite/client" />
// other imports...
import { useEffect } from "react";
import {
    HeadContent,
    Outlet,
    Scripts,
    createRootRoute,
    useNavigate,
} from "@tanstack/react-router";
import appCss from "@/src/styles/app.css?url";
import { ClerkProvider } from "@clerk/tanstack-react-start";
import NavList from "@/src/components/nav-list";
import { useApp } from "@/src/providers/app-provider";
import { useWordStore } from "@/src/providers/word-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const RootDocument = ({ children }: Readonly<{
    children?: React.ReactNode
}>
) => {

    return (
        <html>
            <head>
                <HeadContent />
            </head>
            <body>
                <ClerkProvider>
                    <TooltipProvider>
                        {children}
                    </TooltipProvider>
                </ClerkProvider>
                <Scripts />
            </body>
        </html>
    );
}


const RootLayout: React.FC = () => {
    // const { role, setSignedIn, signedIn, setRole } = useApp();
    const user = useApp((state) => state.user);
    const clearUser = useApp((state) => state.clearUser);
    const navigate = useNavigate();

    const fetchWords = useWordStore((state) => state.fetchWords);
    const isLoading = useWordStore((state) => state.isLoading);


    useEffect(() => {
        fetchWords();
    }, [fetchWords]);

    return (
        <RootDocument>
            <nav className="flex flex-row items-center justify-end mx-4 my-2">
                <NavList />
            </nav>
            <main className="mx-auto flex max-w-[1600px]">
                <Outlet />
            </main>
            {/* {isLoading && <LoadingOverlay />} */}
        </RootDocument>
    );

}
export const Route = createRootRoute({
    head: () => ({
        meta: [
            {
                charSet: "utf-8",
            },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
            {
                title: "TanStack Start Starter",
            },
        ],
        links: [
            {
                rel: "stylesheet",
                href: appCss,
            }
        ]
    }),
    component: RootLayout,
});