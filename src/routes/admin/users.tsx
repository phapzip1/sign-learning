import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import PageHeading from "@/src/components/page-heading";
import DataTable from "@/src/components/data-table";

const AdminUsersPage: React.FC = () => {

    return (
        <div>
            <PageHeading
                eyebrow="Admin"
                title="User moderation"
                description="Review registered users and ban accounts that violate site policy."
                action={<Badge variant="secondary">{usersData.length} users shown</Badge>}
            />
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Registered users</CardTitle>
                            <CardDescription>Moderation controls are mocked in this UI template.</CardDescription>
                        </div>
                        <div className="relative sm:w-72">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input className="pl-10" placeholder="Search users..." />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={usersData} />
                </CardContent>
            </Card>

            <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selected?.status === "Active" ? "Ban this user?" : "Restore this user?"}
                        </DialogTitle>
                        <DialogDescription>
                            {selected?.status === "Active"
                                ? `${selected?.name} will lose access to their account until an admin restores it.`
                                : `${selected?.name} will regain access to the web.`}
                        </DialogDescription>
                    </DialogHeader>
                    {selected?.status === "Active" && (
                        <div className="space-y-2">
                            <Label>Moderation reason</Label>
                            <Select defaultValue="policy">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="policy">Policy violation</SelectItem>
                                    <SelectItem value="spam">Spam submissions</SelectItem>
                                    <SelectItem value="abuse">Abusive behavior</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelected(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant={selected?.status === "Active" ? "destructive" : "default"}
                            onClick={confirmModeration}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export const Route = createFileRoute("/admin/users")({
    component: AdminUsersPage,
})