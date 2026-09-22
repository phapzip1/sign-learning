import { createFileRoute } from "@tanstack/react-router";

const AdminUsersPage: React.FC = () => {

    return (
        <div>
        </div>
    );
}

export const Route = createFileRoute("/admin/users")({
    component: AdminUsersPage,
})