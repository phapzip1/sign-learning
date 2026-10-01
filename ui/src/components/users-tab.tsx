import { useEffect, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Search,
    Users,
} from "lucide-react";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { AdminUsersPage } from "@/src/types/user.type";
import { getAdminUsers } from "@/src/lib/api";


const PAGE_SIZE = 20;

const getInitials = (firstName: string | null, lastName: string | null, email: string) => {
    const first = firstName?.[0] ?? "";

    const last = lastName?.[0] ?? "";

    const result = `${first}${last}`.trim().toUpperCase();

    if (result)
        return result;

    return (
        email[0]?.toUpperCase() ??
        "U"
    );
}

const UsersTab = () => {
    const [page, setPage] = useState(1);

    const [searchInput, setSearchInput] = useState("");

    const [search, setSearch] = useState("");

    const [data, setData] = useState<AdminUsersPage | null>(null);

    const [
        loading,
        setLoading,
    ] = useState(true);

    //
    // Debounce search
    //
    useEffect(() => {
        const timeout = setTimeout(() => {
            setPage(1);
            setSearch(searchInput.trim());
        }, 300);

        return () => {
            clearTimeout(timeout);
        };
    }, [searchInput]);

    //
    // Load users
    //
    useEffect(() => {
        let cancelled = false;

        const loadUsers =
            async () => {
                setLoading(true);

                try {
                    const result = await getAdminUsers({
                        data: {
                            page,
                            pageSize: PAGE_SIZE,
                            search: search || undefined,
                        },
                    });

                    if (cancelled)
                        return;

                    setData(result);
                }
                catch (error) {
                    if (cancelled)
                        return;

                    console.error(
                        "Unable to load users",
                        error
                    );
                }
                finally {
                    if (!cancelled) {
                        setLoading(false);
                    }
                }
            };

        loadUsers();

        return () => {
            cancelled = true;
        };
    }, [
        page,
        search,
    ]);

    const users =
        data?.items ?? [];

    return (
        <Card>
            <CardHeader className="gap-4">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="size-5" />

                            Users
                        </CardTitle>

                        <CardDescription>
                            View users registered
                            through Clerk.
                        </CardDescription>
                    </div>

                    <Badge
                        variant="secondary"
                        className="w-fit"
                    >
                        {data?.total ?? 0} users
                    </Badge>

                </div>

                <div className="relative max-w-sm">

                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                        value={searchInput}
                        onChange={(e) =>
                            setSearchInput(
                                e.target.value
                            )
                        }
                        placeholder="Search users..."
                        className="pl-9"
                    />

                </div>
            </CardHeader>

            <CardContent>
                {loading &&
                    !data ? (
                    <div className="flex min-h-64 items-center justify-center">

                        <Loader2 className="size-6 animate-spin text-muted-foreground" />

                    </div>
                ) : users.length ===
                    0 ? (
                    <div className="flex min-h-64 flex-col items-center justify-center text-center">

                        <Users className="mb-3 size-8 text-muted-foreground" />

                        <p className="font-medium">
                            No users found
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            {search
                                ? "Try a different search."
                                : "There are no users yet."}
                        </p>

                    </div>
                ) : (
                    <>
                        <div className="overflow-hidden rounded-md border">

                            <Table>

                                <TableHeader>
                                    <TableRow>

                                        <TableHead>
                                            User
                                        </TableHead>

                                        <TableHead>
                                            Email
                                        </TableHead>

                                        <TableHead>
                                            Joined
                                        </TableHead>

                                        <TableHead>
                                            Last sign in
                                        </TableHead>

                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {users.map(
                                        (user) => {
                                            const fullName = [
                                                user.firstName,
                                                user.lastName,
                                            ]
                                                .filter(
                                                    Boolean
                                                )
                                                .join(" ");

                                            const initials =
                                                getInitials(
                                                    user.firstName,
                                                    user.lastName,
                                                    user.email
                                                );

                                            return (
                                                <TableRow
                                                    key={
                                                        user.id
                                                    }
                                                >
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">

                                                            <Avatar className="size-9">

                                                                <AvatarImage
                                                                    src={
                                                                        user.imageUrl
                                                                    }
                                                                    alt={
                                                                        fullName ||
                                                                        user.email
                                                                    }
                                                                />

                                                                <AvatarFallback>
                                                                    {
                                                                        initials
                                                                    }
                                                                </AvatarFallback>

                                                            </Avatar>

                                                            <div className="min-w-0">

                                                                <p className="truncate font-medium">
                                                                    {fullName ||
                                                                        "Unnamed user"}
                                                                </p>

                                                                <p className="truncate font-mono text-xs text-muted-foreground">
                                                                    {
                                                                        user.id
                                                                    }
                                                                </p>

                                                            </div>

                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        {
                                                            user.email
                                                        }
                                                    </TableCell>

                                                    <TableCell>
                                                        {formatDate(
                                                            user.createdAt
                                                        )}
                                                    </TableCell>

                                                    <TableCell>
                                                        {user.lastSignInAt
                                                            ? formatDate(
                                                                user.lastSignInAt
                                                            )
                                                            : "Never"}
                                                    </TableCell>

                                                </TableRow>
                                            );
                                        }
                                    )}
                                </TableBody>

                            </Table>

                        </div>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                            <p className="text-sm text-muted-foreground">
                                {data?.total
                                    ? `Showing ${(page - 1) *
                                    PAGE_SIZE +
                                    1
                                    }–${Math.min(
                                        page *
                                        PAGE_SIZE,
                                        data.total
                                    )} of ${data.total
                                    }`
                                    : "0 users"}
                            </p>

                            <div className="flex items-center gap-2">

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                        loading ||
                                        page <= 1
                                    }
                                    onClick={() =>
                                        setPage(
                                            (current) =>
                                                Math.max(
                                                    1,
                                                    current -
                                                    1
                                                )
                                        )
                                    }
                                >
                                    <ChevronLeft className="mr-1 size-4" />

                                    Previous
                                </Button>

                                <span className="min-w-24 text-center text-sm text-muted-foreground">
                                    Page{" "}
                                    {data?.page ?? 1}{" "}
                                    of{" "}
                                    {Math.max(
                                        1,
                                        data?.totalPages ??
                                        1
                                    )}
                                </span>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                        loading ||
                                        !data ||
                                        page >=
                                        data.totalPages
                                    }
                                    onClick={() =>
                                        setPage(
                                            (current) =>
                                                current +
                                                1
                                        )
                                    }
                                >
                                    Next

                                    <ChevronRight className="ml-1 size-4" />
                                </Button>

                            </div>

                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        }
    );
}


export default UsersTab;