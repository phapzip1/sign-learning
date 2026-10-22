/**
 * Root layout for every page: HTML document, Clerk provider, header with navigation,
 * and default page metadata.
 */

// src/routes/__root.tsx
/// <reference types="vite/client" />
// other imports...
import {
    HeadContent,
    Link,
    Outlet,
    Scripts,
    createRootRoute,
} from "@tanstack/react-router";
import appCss from "@/src/styles/app.css?url";
import { ClerkProvider } from "@clerk/tanstack-react-start";
import NavList from "@/src/components/nav-list";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Hand } from "lucide-react";

const RootDocument = ({ children }: Readonly<{
    children?: React.ReactNode
}>
) => {

    return (
        <html lang="en">
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


    return (
        <RootDocument>
            <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
                    <Link to="/" className="flex items-center gap-2.5 font-extrabold text-lg">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
                            <Hand className="size-5" />
                        </span>
                        Sign Learning
                    </Link>
                    <NavList />
                </div>
            </header>
            <main className="mx-auto flex w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
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
                title: "Sign Learning",
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