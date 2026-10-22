/** Placeholder page (not built yet); the admin area lives at /admin. */

import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";

const AdminCustomizePage: React.FC = () => {

    return (
        <div>

        </div>
    );
}

export const Route = createFileRoute("/admin/customize")({
    component: AdminCustomizePage
});