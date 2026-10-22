/** Creates the TanStack Router instance from the generated route tree (routeTree.gen.ts). */

import { createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"

export function getRouter() {
    const router = createRouter({
        routeTree,
        scrollRestoration: true,
    })

    return router
}