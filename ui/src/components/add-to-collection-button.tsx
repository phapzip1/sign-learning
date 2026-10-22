/**
 * "Add to a collection" dialog on word pages: pick one of the user's decks (or create
 * one) and save the word there. Moving a word between decks keeps its study progress.
 */

import React from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { CircleCheck, Heart, Loader2, TriangleAlert } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RemoteCollectionCard } from "@/src/types/collection.type";
import { addNewCards, belongCollection, createCollection, getCollections } from "@/src/lib/api";
import { toApiError } from "@/src/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";

/** Inline result message after saving or creating. */
type Feedback = { tone: "success" | "error"; message: string } | null;

/** Success or error line, announced to screen readers. */
const FeedbackMessage: React.FC<{ feedback: Feedback }> = ({ feedback }) => {
    if (!feedback)
        return null;

    const Icon = feedback.tone === "success" ? CircleCheck : TriangleAlert;

    return (
        <p
            role={feedback.tone === "error" ? "alert" : "status"}
            className={feedback.tone === "success"
                ? "flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground"
                : "flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"}
        >
            <Icon className="size-4 shrink-0" />
            {feedback.message}
        </p>
    );
}

/**
 * Trigger button plus dialog for saving a word to a deck.
 * @param wordId Dictionary id of the word to save.
 * @param trigger Optional custom trigger element.
 */
const AddToCollectionButton: React.FC<{
    wordId: number;
    trigger?: React.JSX.Element
    className?: string;
}> = ({ wordId, trigger, className }) => {
    const { getToken } = useAuth();
    const [loading, setLoading] = React.useState(false);
    const [loadError, setLoadError] = React.useState<string | null>(null);
    const [saving, setSaving] = React.useState(false);
    const [feedback, setFeedback] = React.useState<Feedback>(null);
    const [collections, setCollections] = React.useState<RemoteCollectionCard[]>([]);
    const [wordCollection, setWordCollection] = React.useState<string | null>(null);
    const [selected, setSelected] = React.useState<string | null>(null);

    const [createOpen, setCreateOpen] = React.useState(false);
    const [creating, setCreating] = React.useState(false);
    const [createError, setCreateError] = React.useState<string | null>(null);
    const [nameTouched, setNameTouched] = React.useState(false);
    const [inputs, setInputs] = React.useState<{ name: string; description: string }>({
        name: "",
        description: ""
    });

    const authHeader = async () => `Bearer ${await getToken()}`;

    const fetchCollections = async () => {
        setLoading(true);
        setLoadError(null);

        try {
            const auth = await authHeader();
            const [data, belongTo] = await Promise.all([
                getCollections(auth),
                belongCollection(wordId, auth),
            ]);

            setCollections(data);
            setWordCollection(belongTo);
            setSelected((prev) => prev ?? belongTo);
        } catch (error) {
            setLoadError(toApiError(error).message);
        } finally {
            setLoading(false);
        }
    }

    const onSave = async () => {
        if (!selected || saving)
            return;

        const target = collections.find((col) => col.id === selected);

        setSaving(true);
        setFeedback(null);

        try {
            const result = await addNewCards(selected, [wordId], await authHeader());

            setFeedback(result.added > 0
                ? { tone: "success", message: `Added to "${target?.name}".` }
                : result.moved > 0
                    ? { tone: "success", message: `Moved to "${target?.name}". Your study progress came with it.` }
                    : result.alreadyInDeck > 0
                        ? { tone: "success", message: `This sign is already in "${target?.name}".` }
                        : { tone: "error", message: "We couldn't add this sign. It may no longer exist." });

            setWordCollection(await belongCollection(wordId, await authHeader()));
        } catch (error) {
            setFeedback({ tone: "error", message: toApiError(error).message });
        } finally {
            setSaving(false);
        }
    }

    const onOpenChange = (open: boolean) => {
        if (open) {
            setFeedback(null);
            setSelected(null);
            fetchCollections();
        }
    }

    const nameMissing = inputs.name.trim().length === 0;

    const onCreateCollection = async () => {
        setNameTouched(true);

        if (nameMissing || creating)
            return;

        setCreating(true);
        setCreateError(null);

        try {
            const created = await createCollection({
                name: inputs.name.trim(),
                description: inputs.description.trim(),
            }, await authHeader());

            setCreateOpen(false);
            await fetchCollections();
            setSelected(created.id);
        } catch (error) {
            setCreateError(toApiError(error).message);
        } finally {
            setCreating(false);
        }
    }

    const onCreateOpenChange = (open: boolean) => {
        setCreateOpen(open);

        if (!open) {
            setInputs({ name: "", description: "" });
            setNameTouched(false);
            setCreateError(null);
        }
    }

    return (
        <Dialog onOpenChange={onOpenChange}>
            <DialogTrigger
                className={className}
                render={trigger}
            >
                <Heart />
                Add to a collection
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select a collection</DialogTitle>
                    <DialogDescription>
                        Choose where to save this sign so you can practise it in your flashcards.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3" aria-live="polite">
                    {
                        loading ? (
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="size-4 animate-spin" />
                                Loading your collections…
                            </p>
                        ) : loadError ? (
                            <div className="flex flex-col items-start gap-2">
                                <FeedbackMessage feedback={{ tone: "error", message: loadError }} />
                                <Button variant="outline" size="sm" onClick={fetchCollections}>
                                    Try again
                                </Button>
                            </div>
                        ) : collections.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                You don't have any collections yet. Create one to save this sign.
                            </p>
                        ) : (
                            <RadioGroup
                                aria-label="Collections"
                                onValueChange={(value: string) => {
                                    setSelected(value);
                                    setFeedback(null);
                                }}
                                value={selected}
                            >
                                {
                                    collections.map(col => (
                                        <Label
                                            key={col.id}
                                            className="cursor-pointer gap-3 rounded-xl border px-3 py-2.5 transition-colors hover:bg-muted has-data-checked:border-primary has-data-checked:bg-secondary"
                                        >
                                            <RadioGroupItem value={col.id} />
                                            <span className="flex-1 font-medium">{col.name}</span>
                                            {col.id === wordCollection && (
                                                <Badge variant="secondary">Saved here</Badge>
                                            )}
                                        </Label>
                                    ))
                                }
                            </RadioGroup>
                        )
                    }

                    {!feedback && wordCollection && selected && selected !== wordCollection && (
                        <p className="text-sm text-muted-foreground">
                            A sign can be in one collection at a time, so this moves it
                            from "{collections.find((col) => col.id === wordCollection)?.name}".
                            Your study progress is kept.
                        </p>
                    )}

                    <FeedbackMessage feedback={feedback} />
                </div>

                <DialogFooter className="gap-2">
                    <Dialog open={createOpen} onOpenChange={onCreateOpenChange}>
                        <DialogTrigger
                            render={
                                <Button variant="outline">
                                    Create new collection
                                </Button>
                            }
                        />
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create a collection</DialogTitle>
                            </DialogHeader>
                            <form
                                className="flex flex-col gap-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    onCreateCollection();
                                }}
                            >
                                <Field data-invalid={nameTouched && nameMissing}>
                                    <FieldLabel htmlFor="collection-name">
                                        Collection name
                                    </FieldLabel>
                                    <Input
                                        id="collection-name"
                                        placeholder="Easy collection"
                                        required
                                        aria-invalid={nameTouched && nameMissing}
                                        onChange={e => setInputs(prev => ({ ...prev, name: e.target.value }))}
                                        onBlur={() => setNameTouched(true)}
                                        value={inputs.name}
                                    />
                                    {nameTouched && nameMissing
                                        ? <FieldError>Enter a name for your collection.</FieldError>
                                        : <FieldDescription>Enter your collection name</FieldDescription>}
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="collection-description">
                                        Collection description
                                    </FieldLabel>
                                    <Input
                                        id="collection-description"
                                        placeholder="Purposes..."
                                        value={inputs.description}
                                        onChange={e => setInputs(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                    <FieldDescription>
                                        Optional: what this collection is for
                                    </FieldDescription>
                                </Field>
                                <FeedbackMessage feedback={createError ? { tone: "error", message: createError } : null} />
                                <Button type="submit" disabled={creating}>
                                    {creating ? <><Loader2 className="animate-spin" /> Creating…</> : "Create"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Button
                        onClick={onSave}
                        disabled={!selected || selected === wordCollection || saving || loading}
                    >
                        {saving
                            ? <><Loader2 className="animate-spin" /> Saving…</>
                            : wordCollection && selected && selected !== wordCollection
                                ? "Move to collection"
                                : "Add to collection"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default AddToCollectionButton;
