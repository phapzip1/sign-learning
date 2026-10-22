/**
 * TanStack Start setup: runs Clerk's middleware on every server request so server
 * functions and SSR know who is signed in.
 */

import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createStart } from "@tanstack/react-start";

export const startInstance = createStart(() => {
    return {
        requestMiddleware: [clerkMiddleware()],
    }
});