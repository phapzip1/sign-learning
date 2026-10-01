export type AdminUser = {
    id: string;

    firstName: string | null;
    lastName: string | null;

    email: string;

    imageUrl: string;

    createdAt: number;

    lastSignInAt: number | null;
};


export type AdminUsersPage = {
    page: number;
    pageSize: number;

    total: number;
    totalPages: number;

    items: AdminUser[];
};