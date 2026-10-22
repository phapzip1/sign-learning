/**
 * Turns failed API calls into a predictable error kind and a friendly message, so every
 * screen can show the same loading/error states without exposing server details.
 */

import axios from "axios";

/** Category of a failed request, used to pick the message and any special handling. */
type ApiErrorKind =
    | "network"
    | "timeout"
    | "unauthorized"
    | "forbidden"
    | "not-found"
    | "conflict"
    | "validation"
    | "server"
    | "unknown";

/** A failed request: its kind, HTTP status (when there was a response) and a user-facing message. */
type ApiError = {
    kind: ApiErrorKind;
    status?: number;
    message: string;
};

const MESSAGES: Record<ApiErrorKind, string> = {
    network: "We couldn't reach the server. Check your connection and try again.",
    timeout: "The server took too long to respond. Please try again.",
    unauthorized: "Your session has ended. Please sign in again.",
    forbidden: "You don't have permission to do that.",
    "not-found": "We couldn't find what you were looking for.",
    conflict: "This was changed by someone else. Refresh and try again.",
    validation: "Some of the details aren't valid. Please check them and try again.",
    server: "Something went wrong on our side. Please try again.",
    unknown: "Something went wrong. Please try again.",
};

/** Maps an HTTP status code to an error kind. */
const kindFromStatus = (status: number): ApiErrorKind => {
    if (status === 401) return "unauthorized";
    if (status === 403) return "forbidden";
    if (status === 404) return "not-found";
    if (status === 409) return "conflict";
    if (status === 400 || status === 422) return "validation";
    if (status >= 500) return "server";
    return "unknown";
};

// Maps any thrown value (usually an AxiosError) to a predictable kind and a
// user-facing message. Never surfaces raw server payloads or stack traces.
const toApiError = (error: unknown): ApiError => {
    if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
            return { kind: "timeout", message: MESSAGES.timeout };
        }

        if (!error.response) {
            return { kind: "network", message: MESSAGES.network };
        }

        const status = error.response.status;
        const kind = kindFromStatus(status);

        return { kind, status, message: MESSAGES[kind] };
    }

    return { kind: "unknown", message: MESSAGES.unknown };
};

/** True when the error is an HTTP 404 response. */
const isNotFound = (error: unknown) =>
    axios.isAxiosError(error) && error.response?.status === 404;

export type { ApiError, ApiErrorKind };

export {
    toApiError,
    isNotFound,
}
