/**
 * Side sheet for creating or editing a deck. When editing, it loads the deck's study
 * settings so they can be changed; learning steps are entered in minutes and sent in seconds.
 */

import React from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { createCollection, getCollection, updateCollection } from "@/src/lib/api";
import { toApiError } from "@/src/lib/errors";
import { RemoteCollectionUpsert } from "@/src/types/collection.type";
import { useAuth } from "@clerk/tanstack-react-start";

/** Form fields as typed by the user (strings until validated). */
type FormValues = {
    name: string;
    description: string;
    // Comma-separated minutes, e.g. "1, 10". The API stores seconds.
    learningSteps: string;
    relearningSteps: string;
    maximumInterval: string;
    newCardsPerDay: string;
    maximumReviewsPerDay: string;
};

/** Validation message per field. */
type FormErrors = Partial<Record<keyof FormValues, string>>;

const SETTING_FIELDS = ["learningSteps", "relearningSteps", "maximumInterval", "newCardsPerDay", "maximumReviewsPerDay"] as const;

/** Seconds from the API → "1, 10" (minutes) for the input. */
const formatSteps = (seconds: number[]) =>
    seconds.map((s) => Number((s / 60).toFixed(2))).join(", ");

// Returns seconds, or an error message.
/** "1, 10" (minutes) → seconds, or an error message. */
const parseSteps = (text: string): number[] | string => {
    const parts = text.split(/[\s,]+/).filter(Boolean);
    const seconds: number[] = [];

    for (const part of parts) {
        const minutes = Number(part);
        const value = Math.round(minutes * 60);

        if (!Number.isFinite(minutes) || value <= 0) {
            return "Use positive numbers of minutes, separated by commas (e.g. 1, 10).";
        }

        seconds.push(value);
    }

    return seconds;
}

// Whole number >= min, or an error message.
/** Parses a whole number of at least `min`, or returns an error message. */
const parseWhole = (text: string, min: number, label: string): number | string => {
    if (!/^\d+$/.test(text.trim())) {
        return `${label} must be a whole number.`;
    }

    const value = Number(text.trim());

    return value < min ? `${label} must be at least ${min}.` : value;
}

/**
 * Create/edit deck sheet.
 * @param id Deck id when editing; omit to create a deck.
 * @param onCompleted Called after a successful save.
 */
const DeckEditor: React.FC<{
    onCompleted?: () => void;
    title?: string;
    description?: string;
    id?: string;
    trigger?: React.JSX.Element;
}> = ({ title, description, id, onCompleted, trigger }) => {
    const { getToken } = useAuth();
    const isEdit = Boolean(id);

    const [open, setOpen] = React.useState(false);
    const [loadingConfig, setLoadingConfig] = React.useState(false);
    const [loadError, setLoadError] = React.useState<string | null>(null);
    const [saving, setSaving] = React.useState(false);
    const [saveError, setSaveError] = React.useState<string | null>(null);
    const [errors, setErrors] = React.useState<FormErrors>({});
    const [values, setValues] = React.useState<FormValues>({
        name: title ?? "",
        description: description ?? "",
        learningSteps: "",
        relearningSteps: "",
        maximumInterval: "",
        newCardsPerDay: "",
        maximumReviewsPerDay: "",
    });

    const setValue = (key: keyof FormValues, value: string) => {
        setValues((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    }

    const loadConfig = async () => {
        if (!id)
            return;

        setLoadingConfig(true);
        setLoadError(null);

        try {
            const deck = await getCollection(id, `Bearer ${await getToken()}`);

            setValues({
                name: deck.name,
                description: deck.description ?? "",
                learningSteps: formatSteps(deck.learningSteps),
                relearningSteps: formatSteps(deck.relearningSteps),
                maximumInterval: String(deck.maximumInterval),
                newCardsPerDay: String(deck.newCardsPerDay),
                maximumReviewsPerDay: String(deck.maximumReviewsPerDay),
            });
        } catch (error) {
            setLoadError(toApiError(error).message);
        } finally {
            setLoadingConfig(false);
        }
    }

    const onOpenChange = (next: boolean) => {
        if (saving)
            return;

        setOpen(next);

        if (next) {
            setErrors({});
            setSaveError(null);
            setValues((prev) => ({ ...prev, name: title ?? "", description: description ?? "" }));
            loadConfig();
        }
    }

    // Builds the request body, or returns field errors.
    const buildPayload = (): { payload: RemoteCollectionUpsert } | { errors: FormErrors } => {
        const found: FormErrors = {};

        if (!values.name.trim()) {
            found.name = "Enter a name for your deck.";
        }

        if (!isEdit) {
            return Object.keys(found).length
                ? { errors: found }
                : { payload: { name: values.name.trim(), description: values.description.trim() } };
        }

        const learningSteps = parseSteps(values.learningSteps);
        const relearningSteps = parseSteps(values.relearningSteps);
        const maximumInterval = parseWhole(values.maximumInterval, 1, "Maximum interval");
        const newCardsPerDay = parseWhole(values.newCardsPerDay, 0, "New cards per day");
        const maximumReviewsPerDay = parseWhole(values.maximumReviewsPerDay, 0, "Maximum reviews per day");

        if (typeof learningSteps === "string") found.learningSteps = learningSteps;
        if (typeof relearningSteps === "string") found.relearningSteps = relearningSteps;
        if (typeof maximumInterval === "string") found.maximumInterval = maximumInterval;
        if (typeof newCardsPerDay === "string") found.newCardsPerDay = newCardsPerDay;
        if (typeof maximumReviewsPerDay === "string") found.maximumReviewsPerDay = maximumReviewsPerDay;

        if (Object.keys(found).length)
            return { errors: found };

        return {
            payload: {
                name: values.name.trim(),
                description: values.description.trim(),
                learningSteps: learningSteps as number[],
                relearningSteps: relearningSteps as number[],
                maximumInterval: maximumInterval as number,
                newCardsPerDay: newCardsPerDay as number,
                maximumReviewsPerDay: maximumReviewsPerDay as number,
            },
        };
    }

    const confirm = async () => {
        if (saving)
            return;

        const result = buildPayload();

        if ("errors" in result) {
            setErrors(result.errors);
            return;
        }

        setSaving(true);
        setSaveError(null);

        try {
            const token = await getToken();

            if (id) {
                await updateCollection(id, result.payload, `Bearer ${token}`);
            } else {
                await createCollection(result.payload, `Bearer ${token}`);
            }

            setOpen(false);
            onCompleted?.();
        } catch (error) {
            const apiError = toApiError(error);

            // The API answers 400 with a plain message for invalid settings.
            const serverMessage = apiError.kind === "validation"
                && typeof (error as { response?: { data?: unknown } }).response?.data === "string"
                ? (error as { response: { data: string } }).response.data
                : null;

            setSaveError(serverMessage ?? apiError.message);
        } finally {
            setSaving(false);
        }
    }

    const fieldProps = (key: keyof FormValues) => ({
        id: `deck-${key}`,
        value: values[key],
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue(key, e.target.value),
        "aria-invalid": Boolean(errors[key]),
        disabled: saving,
    });

    const hint = (key: keyof FormValues, text: React.ReactNode) =>
        errors[key]
            ? <FieldError>{errors[key]}</FieldError>
            : <FieldDescription>{text}</FieldDescription>;

    const settingsReady = !isEdit || (!loadingConfig && !loadError);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger render={trigger}>
                Open sheet
            </SheetTrigger>
            <SheetContent className="data-[side=right]:sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>{isEdit ? "Edit deck" : "Create new deck"}</SheetTitle>
                    <SheetDescription>
                        {isEdit
                            ? "Change the deck's details and how its cards are scheduled."
                            : "New decks start with the default study settings. You can change them after creating the deck."}
                    </SheetDescription>
                </SheetHeader>

                <form
                    id="deck-editor-form"
                    className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        confirm();
                    }}
                >
                    <FieldGroup>
                        <Field data-invalid={Boolean(errors.name)}>
                            <FieldLabel htmlFor="deck-name">Name</FieldLabel>
                            <Input {...fieldProps("name")} placeholder="Sample title" required />
                            {errors.name && <FieldError>{errors.name}</FieldError>}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="deck-description">Description</FieldLabel>
                            <Input {...fieldProps("description")} placeholder="Optional: what this deck is for" />
                        </Field>
                    </FieldGroup>

                    {isEdit && (
                        <FieldSet>
                            <FieldLegend>Study settings</FieldLegend>
                            {
                                loadingConfig ? (
                                    <div className="flex flex-col gap-3" aria-label="Loading study settings">
                                        {SETTING_FIELDS.map((key) => <Skeleton key={key} className="h-14 w-full" />)}
                                    </div>
                                ) : loadError ? (
                                    <div className="flex flex-col items-start gap-2">
                                        <p role="alert" className="flex items-center gap-2 text-sm font-medium text-destructive">
                                            <TriangleAlert className="size-4 shrink-0" />
                                            {loadError}
                                        </p>
                                        <Button type="button" variant="outline" size="sm" onClick={loadConfig}>
                                            Try again
                                        </Button>
                                    </div>
                                ) : (
                                    <FieldGroup>
                                        <Field data-invalid={Boolean(errors.learningSteps)}>
                                            <FieldLabel htmlFor="deck-learningSteps">Learning steps (minutes)</FieldLabel>
                                            <Input {...fieldProps("learningSteps")} inputMode="decimal" placeholder="1, 10" />
                                            {hint("learningSteps", "How long to wait before showing a new card again while you learn it. Rating Good moves to the next step; after the last step the card is scheduled in days. Leave empty to skip learning.")}
                                        </Field>
                                        <Field data-invalid={Boolean(errors.relearningSteps)}>
                                            <FieldLabel htmlFor="deck-relearningSteps">Relearning steps (minutes)</FieldLabel>
                                            <Input {...fieldProps("relearningSteps")} inputMode="decimal" placeholder="10" />
                                            {hint("relearningSteps", "The same, for a card you forgot (rated Again) after it was already learned.")}
                                        </Field>
                                        <Field data-invalid={Boolean(errors.maximumInterval)}>
                                            <FieldLabel htmlFor="deck-maximumInterval">Maximum interval (days)</FieldLabel>
                                            <Input {...fieldProps("maximumInterval")} inputMode="numeric" />
                                            {hint("maximumInterval", "The longest gap between reviews of a learned card.")}
                                        </Field>
                                        <Field data-invalid={Boolean(errors.newCardsPerDay)}>
                                            <FieldLabel htmlFor="deck-newCardsPerDay">New cards per day</FieldLabel>
                                            <Input {...fieldProps("newCardsPerDay")} inputMode="numeric" />
                                            {hint("newCardsPerDay", "How many never-studied cards to introduce each day. The day resets at midnight UTC. Use 0 to pause new cards.")}
                                        </Field>
                                        <Field data-invalid={Boolean(errors.maximumReviewsPerDay)}>
                                            <FieldLabel htmlFor="deck-maximumReviewsPerDay">Maximum reviews per day</FieldLabel>
                                            <Input {...fieldProps("maximumReviewsPerDay")} inputMode="numeric" />
                                            {hint("maximumReviewsPerDay", "Saved with the deck, but not applied to study sessions yet.")}
                                        </Field>
                                    </FieldGroup>
                                )
                            }
                        </FieldSet>
                    )}

                    {saveError && (
                        <p role="alert" className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                            <TriangleAlert className="size-4 shrink-0" />
                            {saveError}
                        </p>
                    )}
                </form>

                <SheetFooter>
                    <Button
                        type="submit"
                        form="deck-editor-form"
                        disabled={saving || !settingsReady}
                    >
                        {saving ? <><Loader2 className="animate-spin" /> Saving…</> : isEdit ? "Save changes" : "Create deck"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

export default DeckEditor;
