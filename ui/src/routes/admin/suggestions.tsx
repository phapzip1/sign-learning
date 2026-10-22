/** Placeholder page (not built yet); the admin area lives at /admin. */

import { createFileRoute } from "@tanstack/react-router";

const AdminSuggestionsPage: React.FC = () => {

    return (
        <div>
        </div>
    );
}

export const Route = createFileRoute("/admin/suggestions")({
    component: AdminSuggestionsPage
})