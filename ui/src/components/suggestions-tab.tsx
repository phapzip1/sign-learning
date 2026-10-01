import {
    useEffect,
    useMemo,
    useState,
} from "react";

import { useAuth } from "@clerk/tanstack-react-start";

import {
    Check,
    Loader2,
    Search,
    X,
} from "lucide-react";

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
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


import {
    approveSuggestion,
    getAdminSuggestions,
    getClaims,
    rejectSuggestion,
} from "@/src/lib/api";
import { WORD_LEVELS, WordLevel } from "@/src/types/word.type";
import { SuggestionStatus, WordSuggestion } from "@/src/types/suggestion.type";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { WORD_TOPICS } from "@/src/types/topic.type";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ReviewForm = {
    value: string;
    meaning: string;

    cover: string;

    demoURL: string;
    instruction: string;

    level: WordLevel;
    topic: number;

    reviewNote: string;
};

const emptyReviewForm: ReviewForm = {
    value: "",
    meaning: "",

    cover: "",

    demoURL: "",
    instruction: "",

    level: "Beginner",
    topic: 7,

    reviewNote: "",
};

const StatusBadge = ({ status }: {
    status: SuggestionStatus;
}) => {
    switch (status) {
        case "Approved":
            return (
                <Badge>
                    Approved
                </Badge>
            );

        case "Rejected":
            return (
                <Badge variant="destructive">
                    Rejected
                </Badge>
            );

        default:
            return (
                <Badge variant="secondary">
                    Pending
                </Badge>
            );
    }
}

const formatDate = (
    value: string
) => {
    return new Date(value).toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        }
    );
}

const SuggestionRow: React.FC<{
    suggestion:
    WordSuggestion;
    onReview: () => void;
}> = ({ suggestion, onReview }) => {
    const topic = WORD_TOPICS.find((topic) => topic.name === suggestion.topic);

    return (
        <TableRow>
            <TableCell className="font-medium">
                {suggestion.value}
            </TableCell>

            <TableCell>
                <p className="max-w-80 truncate">
                    {
                        suggestion.meaning
                    }
                </p>
            </TableCell>

            <TableCell>
                <Badge variant="outline">
                    {
                        suggestion.level
                    }
                </Badge>
            </TableCell>

            <TableCell>
                {topic?.value ?? "Other"}
            </TableCell>

            <TableCell>
                {formatDate(
                    suggestion.createdAt
                )}
            </TableCell>

            <TableCell>
                <StatusBadge
                    status={
                        suggestion.status
                    }
                />
            </TableCell>

            <TableCell>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={
                        onReview
                    }
                >
                    {suggestion.status === "Pending" ? "Review" : "View"}
                </Button>
            </TableCell>
        </TableRow>
    );
}

const ReviewSuggestionSheet: React.FC<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    suggestion: WordSuggestion | null;
    onUpdated?: () => void;
}> = ({ open, onOpenChange, suggestion, onUpdated }) => {
    const { getToken } = useAuth();

    const [form, setForm,] = useState<ReviewForm>(emptyReviewForm);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open || !suggestion)
            return;

        setForm({
            value: suggestion.value,
            meaning: suggestion.meaning,
            // Cover is provided by admin
            cover: "",
            demoURL: suggestion.demoURL ?? "",
            instruction: suggestion.instruction ?? "",
            level: suggestion.level,
            topic: WORD_TOPICS.find(t => t.name === suggestion.topic)?.id ?? 7,
            reviewNote: suggestion.reviewNote ?? "",
        });
    }, [open, suggestion]);

    if (!suggestion)
        return null;


    const pending = suggestion.status === "Pending";

    const validForApproval =
        form.value.trim()
            .length > 0 &&
        form.meaning.trim()
            .length > 0 &&
        form.cover.trim()
            .length > 0 &&
        form.demoURL.trim()
            .length > 0 &&
        form.instruction.trim()
            .length > 0;

    const handleApprove = async () => {
        if (!pending || !validForApproval)
            return;

        const token = await getToken();

        if (!token)
            return;

        setSubmitting(true);

        try {
            await approveSuggestion(
                suggestion.id,
                {
                    value: form.value.trim(),
                    meaning: form.meaning.trim(),
                    cover: form.cover.trim(),
                    demoURL: form.demoURL.trim(),
                    instruction: form.instruction.trim(),
                    level: form.level,
                    topic: form.topic,
                    reviewNote: form.reviewNote.trim() || undefined,
                },
                token
            );

            onOpenChange(false);

            onUpdated?.();
        }
        catch (error) {
            console.error(
                "Unable to approve suggestion",
                error
            );
        }
        finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!pending)
            return;

        const token = await getToken();

        if (!token)
            return;

        setSubmitting(true);

        try {
            await rejectSuggestion(
                suggestion.id,
                {
                    reviewNote:
                        form.reviewNote
                            .trim() ||
                        undefined,
                },
                token
            );

            onOpenChange(false);

            onUpdated?.();
        }
        catch (error) {
            console.error("Unable to reject suggestion", error);
        }
        finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet
            
            open={open}
            onOpenChange={
                onOpenChange
            }
        >
            <SheetContent
                side="right"
                className="w-full overflow-y-auto sm:max-w-xl min-w-130"
            >
                <SheetHeader>
                    <SheetTitle>
                        {pending
                            ? "Review Suggestion"
                            : "Suggestion"}
                    </SheetTitle>

                    <SheetDescription>
                        {pending
                            ? "Review and complete the word before adding it to the dictionary."
                            : "View the submitted suggestion."}
                    </SheetDescription>
                </SheetHeader>

                <div className="grid gap-5 px-4 py-6">

                    <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-center justify-between gap-4">

                            <div>
                                <p className="text-sm font-medium">
                                    Submitted by
                                </p>

                                <p className="mt-1 font-mono text-xs text-muted-foreground">
                                    {
                                        suggestion.userId
                                    }
                                </p>
                            </div>

                            <StatusBadge
                                status={
                                    suggestion.status
                                }
                            />

                        </div>

                        {suggestion.note && (
                            <div className="mt-4 border-t pt-4">

                                <p className="text-sm font-medium">
                                    User note
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    {
                                        suggestion.note
                                    }
                                </p>

                            </div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label>
                            Word
                        </Label>

                        <Input
                            disabled={!pending}
                            value={
                                form.value
                            }
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    value:
                                        e.target.value,
                                })
                            }
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>
                            Meaning
                        </Label>

                        <Textarea
                            disabled={!pending}
                            value={
                                form.meaning
                            }
                            onChange={(e) => setForm({
                                ...form,
                                meaning: e.target.value,
                            })}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">

                        <div className="grid gap-2">
                            <Label>
                                Level
                            </Label>

                            <Select
                                disabled={!pending}
                                value={form.level}
                                onValueChange={(
                                    value
                                ) =>
                                    setForm({
                                        ...form,
                                        level:
                                            value as WordLevel,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                    {WORD_LEVELS.map(
                                        (level) => (
                                            <SelectItem
                                                key={level}
                                                value={level}
                                            >
                                                {level}
                                            </SelectItem>
                                        )
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                Topic
                            </Label>

                            <Select
                                value={form.topic}
                                itemToStringLabel={(item) => WORD_TOPICS.find(t => item === t.id)?.value || "Invalid"}
                                onValueChange={(value) =>
                                    setForm({
                                        ...form,
                                        topic: value || 0,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                    {
                                        WORD_TOPICS.map(
                                            (topic) => (
                                                <SelectItem
                                                    key={topic.id}
                                                    value={topic.id}
                                                >
                                                    {
                                                        topic.value
                                                    }
                                                </SelectItem>
                                            )
                                        )
                                    }

                                </SelectContent>
                            </Select>
                        </div>

                    </div>

                    {pending && (
                        <div className="grid gap-2">
                            <Label>
                                Cover
                            </Label>

                            <Input
                                value={
                                    form.cover
                                }
                                placeholder="https://..."
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        cover:
                                            e.target.value,
                                    })
                                }
                            />

                            {form.cover && (
                                <div className="overflow-hidden rounded-lg border">
                                    <img
                                        src={
                                            form.cover
                                        }
                                        alt="Cover preview"
                                        className="aspect-video w-full object-cover"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label>
                            Demo URL
                        </Label>

                        <Input
                            disabled={!pending}
                            value={
                                form.demoURL
                            }
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    demoURL:
                                        e.target.value,
                                })
                            }
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>
                            Instruction
                        </Label>

                        <Textarea
                            disabled={!pending}
                            rows={5}
                            value={
                                form.instruction
                            }
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    instruction:
                                        e.target.value,
                                })
                            }
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>
                            Review Note
                        </Label>

                        <Textarea
                            disabled={!pending}
                            rows={3}
                            value={
                                form.reviewNote
                            }
                            placeholder="Optional note..."
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    reviewNote:
                                        e.target.value,
                                })
                            }
                        />
                    </div>

                    {suggestion.approvedWordId && (
                        <div className="rounded-md border p-3 text-sm">
                            Created Word ID:{" "}
                            <span className="font-medium">
                                {
                                    suggestion.approvedWordId
                                }
                            </span>
                        </div>
                    )}

                </div>

                {pending && (
                    <SheetFooter className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            variant="destructive"
                            disabled={submitting}
                            onClick={handleReject}
                            className="w-full sm:w-auto"
                        >
                            <X className="mr-2 size-4" />
                            Reject
                        </Button>

                        <Button
                            disabled={
                                submitting ||
                                !validForApproval
                            }
                            onClick={handleApprove}
                            className="w-full sm:flex-1"
                        >
                            {submitting ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                                <Check className="mr-2 size-4" />
                            )}

                            Approve & Add Word
                        </Button>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}


const SuggestionsTab: React.FC = () => {
    const { getToken } = useAuth();

    const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);

    const [status, setStatus] = useState<SuggestionStatus>("Pending");

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);

    const [selected, setSelected] = useState<WordSuggestion | null>(null);

    const [sheetOpen, setSheetOpen] = useState(false);

    useEffect(() => {
        loadSuggestions();
    }, [status]);

    const loadSuggestions =
        async () => {
            setLoading(true);

            try {
                const token = await getToken();

                if (!token)
                    return;

                const result = await getAdminSuggestions(status, token);

                setSuggestions(result);
            }
            catch (error) {
                console.error("Unable to load suggestions", error);
            }
            finally {
                setLoading(false);
            }
        };

    const filteredSuggestions = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value)
            return suggestions;

        return suggestions
            .filter((suggestion) => suggestion.value.toLowerCase().includes(value)
                || suggestion.meaning.toLowerCase().includes(value)
            );
    }, [suggestions, search]);

    const openReview = (suggestion: WordSuggestion) => {
        setSelected(suggestion);

        setSheetOpen(true);
    };

    const handleSheetOpenChange = (open: boolean) => {
        setSheetOpen(open);

        if (!open) {
            setSelected(null);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                            <CardTitle>
                                Word Suggestions
                            </CardTitle>

                            <CardDescription>
                                Review words suggested
                                by users.
                            </CardDescription>
                        </div>

                        <Badge
                            variant="secondary"
                            className="w-fit"
                        >
                            {
                                suggestions.length
                            }{" "}
                            {
                                status.toString().toLowerCase()
                            }
                        </Badge>

                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">

                        <div className="relative w-full sm:max-w-sm">

                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search suggestions..."
                                className="pl-9"
                            />

                        </div>

                        <Select
                            value={status}
                            onValueChange={(value) => setStatus(value as SuggestionStatus)}
                        >
                            <SelectTrigger className="w-full sm:w-44">
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="Pending">
                                    Pending
                                </SelectItem>

                                <SelectItem value="Approved">
                                    Approved
                                </SelectItem>

                                <SelectItem value="Rejected">
                                    Rejected
                                </SelectItem>
                            </SelectContent>
                        </Select>

                    </div>
                </CardHeader>

                <CardContent>
                    {loading ? (
                        <div className="flex min-h-64 items-center justify-center">

                            <Loader2 className="size-6 animate-spin text-muted-foreground" />

                        </div>
                    ) : filteredSuggestions.length ===
                        0 ? (
                        <div className="flex min-h-64 flex-col items-center justify-center text-center">

                            <p className="font-medium">
                                No suggestions found
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {search
                                    ? "Try a different search."
                                    : `There are no ${status.toString().toLowerCase()} suggestions.`}
                            </p>

                        </div>
                    ) : (
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
                                            Submitted
                                        </TableHead>

                                        <TableHead>
                                            Status
                                        </TableHead>

                                        <TableHead className="w-24" />

                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {filteredSuggestions.map(
                                        (suggestion) => (
                                            <SuggestionRow
                                                key={
                                                    suggestion.id
                                                }
                                                suggestion={
                                                    suggestion
                                                }
                                                onReview={() =>
                                                    openReview(
                                                        suggestion
                                                    )
                                                }
                                            />
                                        )
                                    )}
                                </TableBody>
                            </Table>

                        </div>
                    )}
                </CardContent>
            </Card>

            <ReviewSuggestionSheet
                open={sheetOpen}
                onOpenChange={
                    handleSheetOpenChange
                }
                suggestion={
                    selected
                }
                onUpdated={() => {
                    loadSuggestions();
                }}
            />
        </>
    );
}

export default SuggestionsTab;
