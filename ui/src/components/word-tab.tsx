import {
    useEffect,
    useState,
} from "react";

import {
    Loader2,
    Pencil,
    Plus,
    Search,
    Trash2,
    TriangleAlert,
} from "lucide-react";

import { useAuth } from "@clerk/tanstack-react-start";

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

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { deleteWord, getWordList } from "@/src/lib/api";
import { toApiError } from "@/src/lib/errors";
import WordPagination from "@/src/components/word-pagination";
import { RemoteWordListResponse, WordItem } from "@/src/types/word.type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import WordEditor from "@/src/components/word-editor";
import { WORD_TOPICS } from "@/src/types/topic.type";

const PAGE_SIZE = 20;


function formatDate(value: string) {
    return new Date(value).toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        }
    );
}

type PagedWordList = Omit<RemoteWordListResponse, "items"> & {
    items: WordItem[];
};

export function WordsTab() {
    const { getToken } = useAuth();

    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [data, setData] = useState<PagedWordList | null>(null);
    const [loading, setLoading] = useState(true);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingWord, setEditingWord] = useState<WordItem | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [wordToDelete, setWordToDelete] = useState<WordItem | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    /*
     * Debounce search
     */
    useEffect(() => {
        const timeout =
            window.setTimeout(() => {
                setPage(1);

                setSearch(
                    searchInput.trim()
                );
            }, 300);

        return () => {
            window.clearTimeout(
                timeout
            );
        };
    }, [searchInput]);

    /*
     * Load words
     */
    useEffect(() => {
        loadWords();
    }, [
        page,
        search,
    ]);

    const loadWords =
        async () => {
            setLoading(true);
            setLoadError(null);

            try {
                const result = await getWordList(
                    {
                        page,
                        pageSize: PAGE_SIZE,
                        search: search || undefined,
                    },
                );

                setData(result);
            }
            catch (error) {
                setLoadError(toApiError(error).message);
            }
            finally {
                setLoading(false);
            }
        };

    const openCreate = () => {
        setEditingWord(null);

        setSheetOpen(true);
    };

    const openEdit = (word: WordItem) => {
        setEditingWord(word);

        setSheetOpen(true);
    };

    const handleSheetChange = (open: boolean) => {
        setSheetOpen(open);

        if (!open) {
            setEditingWord(null);
        }
    };

    const openDelete = (word: WordItem) => {
        setDeleteError(null);
        setWordToDelete(word);
    };

    const confirmDelete = async () => {
        if (!wordToDelete || deleting)
            return;

        setDeleting(true);
        setDeleteError(null);

        try {
            const token = await getToken();

            if (!token)
                throw new Error("Authentication token unavailable.");

            await deleteWord(wordToDelete.id, token);

            setWordToDelete(null);

            // Step back a page if we just removed the last word on this one.
            if (words.length === 1 && page > 1) {
                setPage(page - 1);
            } else {
                loadWords();
            }
        }
        catch (error) {
            const apiError = toApiError(error);

            if (apiError.kind === "not-found") {
                // Already gone (e.g. another admin deleted it): just refresh.
                setWordToDelete(null);
                loadWords();
            } else {
                setDeleteError(apiError.kind === "conflict"
                    ? "This word can't be deleted because other data still depends on it."
                    : apiError.message);
            }
        }
        finally {
            setDeleting(false);
        }
    };

    const words = data?.items ?? [];

    return (
        <>
            <Card>

                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                            <CardTitle>
                                Words
                            </CardTitle>

                            <CardDescription>
                                Manage words in the
                                ASL dictionary.
                            </CardDescription>
                        </div>

                        <Button
                            onClick={openCreate}
                        >
                            <Plus className="mr-2 size-4" />

                            Add Word
                        </Button>

                    </div>

                    <div className="mt-2 flex items-center justify-between gap-4">

                        <div className="relative w-full max-w-sm">

                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search words..."
                                className="pl-9"
                            />

                        </div>
                    </div>
                </CardHeader>

                <CardContent>

                    {loadError ? (
                        <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
                            <p className="flex items-center gap-2 font-medium text-destructive">
                                <TriangleAlert className="size-4" />
                                {loadError}
                            </p>
                            <Button variant="outline" onClick={loadWords}>
                                Try again
                            </Button>
                        </div>
                    ) : loading &&
                        !data ? (
                        <div className="flex min-h-64 items-center justify-center">

                            <Loader2 className="size-6 animate-spin text-muted-foreground" />

                        </div>
                    ) : words.length ===
                        0 ? (
                        <div className="flex min-h-64 flex-col items-center justify-center text-center">

                            <p className="font-medium">
                                No words found
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {search
                                    ? "Try a different search."
                                    : "Add your first word to the dictionary."}
                            </p>

                        </div>
                    ) : (
                        <>
                            <div className="overflow-hidden rounded-md border">

                                <Table>

                                    <TableHeader>
                                        <TableRow>

                                            <TableHead>
                                                Word
                                            </TableHead>

                                            <TableHead>
                                                Meaning
                                            </TableHead>

                                            <TableHead>
                                                Level
                                            </TableHead>

                                            <TableHead>
                                                Topic
                                            </TableHead>

                                            <TableHead>
                                                Updated
                                            </TableHead>

                                            <TableHead className="w-24">
                                                <span className="sr-only">Actions</span>
                                            </TableHead>

                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>

                                        {words.map(
                                            (word) => (
                                                <WordRow
                                                    key={word.id}
                                                    word={word}
                                                    onEdit={() => openEdit(word)
                                                    }
                                                    onDelete={() => openDelete(word)}
                                                />
                                            )
                                        )}

                                    </TableBody>

                                </Table>

                            </div>

                            {(data?.totalPages ?? 0) > 1 && (
                                <WordPagination
                                    className="mt-4"
                                    page={page}
                                    totalPages={data?.totalPages ?? 1}
                                    onPageChange={setPage}
                                />
                            )}
                        </>
                    )}

                </CardContent>

            </Card>

            <Dialog
                open={wordToDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !deleting)
                        setWordToDelete(null);
                }}
            >
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>
                            Delete "{wordToDelete?.title}"?
                        </DialogTitle>
                        <DialogDescription>
                            This permanently removes the word from the dictionary. This can't be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {deleteError && (
                        <p role="alert" className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                            <TriangleAlert className="size-4 shrink-0" />
                            {deleteError}
                        </p>
                    )}
                    <DialogFooter className="flex flex-row justify-between">
                        <DialogClose
                            disabled={deleting}
                            render={
                                <Button variant="secondary" type="button">
                                    Cancel
                                </Button>
                            }
                        />
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleting}
                        >
                            {deleting ? <><Loader2 className="animate-spin" /> Deleting…</> : "Delete word"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <WordEditor
                open={sheetOpen}
                onOpenChange={handleSheetChange}
                word={editingWord}
                onSaved={() => {
                    loadWords();
                }}
            />
        </>
    );
}

const WordRow: React.FC<{
    word: WordItem;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ word, onEdit, onDelete }) => {

    const topic = WORD_TOPICS.find((item) => item.id === word.topic.id);

    return (
        <TableRow>

            <TableCell>
                <div className="flex items-center gap-3">

                    <Avatar className="size-10 rounded-md">

                        <AvatarImage
                            src={
                                word.cover
                            }
                            alt={
                                word.title
                            }
                            className="object-cover"
                        />

                        <AvatarFallback className="rounded-md">
                            {word.title.slice(0, 2).toUpperCase()}
                        </AvatarFallback>

                    </Avatar>

                    <div>
                        <p className="font-medium">
                            {word.title}
                        </p>

                        <p className="text-xs text-muted-foreground">
                            ID: {word.id}
                        </p>
                    </div>

                </div>
            </TableCell>

            <TableCell>
                <p className="max-w-80 truncate">
                    {word.description}
                </p>
            </TableCell>

            <TableCell>
                <Badge variant="outline">
                    {word.level}
                </Badge>
            </TableCell>

            <TableCell>
                {topic?.value ??
                    "Other"}
            </TableCell>

            <TableCell>
                {formatDate(word.updatedAt)}
            </TableCell>

            <TableCell className="whitespace-nowrap">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={
                        onEdit
                    }
                >
                    <Pencil className="size-4" />

                    <span className="sr-only">
                        Edit {word.title}
                    </span>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                >
                    <Trash2 className="size-4" />

                    <span className="sr-only">
                        Delete {word.title}
                    </span>
                </Button>
            </TableCell>

        </TableRow>
    );
}
