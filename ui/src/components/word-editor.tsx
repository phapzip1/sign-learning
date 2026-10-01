import { useEffect, useState } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { Loader2, Plus } from "lucide-react";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    RemoteWordItem,
    WORD_LEVELS,
    WordItem,
    WordLevel,
    WordUpsertPayload
} from "@/src/types/word.type";
import { createWord, updateWord } from "@/src/lib/api";
import { WORD_TOPICS } from "@/src/types/topic.type";


type WordForm = WordUpsertPayload;

const emptyForm: WordForm = {
    value: "",
    meaning: "",
    cover: "",
    demoURL: "",
    instruction: "",
    level: "Beginner",
    topic: 7,
};



const WordEditor: React.FC<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    word?: WordItem | null;
    onSaved?: (word: RemoteWordItem) => void;
}> = ({ open, onOpenChange, word, onSaved }) => {
    const { getToken } = useAuth();

    const [form, setForm] = useState<WordForm>(emptyForm);

    const [submitting, setSubmitting] = useState(false);

    const isEditing = !!word;

    useEffect(() => {
        if (!open)
            return;

        if (word) {
            setForm({
                value: word.title,
                meaning: word.description,
                cover: word.cover,
                demoURL: word.demo,
                instruction: word.instruction,
                level: word.level,
                topic: word.topic.id,
            });

            return;
        }

        setForm(emptyForm);
    }, [open, word]);

    const valid =
        form.value.trim() &&
        form.meaning.trim() &&
        form.cover.trim() &&
        form.demoURL.trim() &&
        form.instruction.trim();

    const handleSubmit = async () => {
        if (!valid)
            return;

        const token = await getToken();

        if (!token)
            return;

        setSubmitting(true);

        try {
            let result: RemoteWordItem;

            if (word) {
                result = await updateWord(word.id, form, token);
            }
            else {
                result = await createWord(form, token);
            }

            onSaved?.(result);

            onOpenChange(false);

            setForm(emptyForm);
        }
        catch (error) {
            console.error(
                isEditing ? "Unable to update word" : "Unable to create word",
                error
            );
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
                        {isEditing
                            ? "Edit Word"
                            : "Create Word"}
                    </SheetTitle>

                    <SheetDescription>
                        {isEditing
                            ? "Update this word in the dictionary."
                            : "Add a new word to the dictionary."}
                    </SheetDescription>
                </SheetHeader>

                <div className="grid gap-5 px-4 py-6">

                    <div className="grid gap-2">
                        <Label htmlFor="word-value">
                            Word
                        </Label>

                        <Input
                            id="word-value"
                            value={form.value}
                            placeholder="Computer"
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
                        <Label htmlFor="word-meaning">
                            Meaning
                        </Label>

                        <Textarea
                            id="word-meaning"
                            value={form.meaning}
                            placeholder="Enter the meaning..."
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    meaning:
                                        e.target.value,
                                })
                            }
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">

                        <div className="grid gap-2">
                            <Label>
                                Level
                            </Label>

                            <Select
                                value={
                                    form.level
                                }
                                onValueChange={(
                                    value
                                ) =>
                                    setForm({
                                        ...form,
                                        level: value as WordLevel,
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
                                                key={
                                                    level
                                                }
                                                value={
                                                    level
                                                }
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

                    <div className="grid gap-2">
                        <Label htmlFor="word-cover">
                            Cover
                        </Label>

                        <Input
                            id="word-cover"
                            value={form.cover}
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
                                    src={form.cover}
                                    alt="Cover preview"
                                    className="aspect-video w-full object-cover"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="word-demo">
                            Demo URL
                        </Label>

                        <Input
                            id="word-demo"
                            value={
                                form.demoURL
                            }
                            placeholder="https://..."
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
                        <Label htmlFor="word-instruction">
                            Instruction
                        </Label>

                        <Textarea
                            id="word-instruction"
                            value={
                                form.instruction
                            }
                            rows={6}
                            placeholder="Explain how to perform the sign..."
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    instruction:
                                        e.target.value,
                                })
                            }
                        />
                    </div>

                </div>

                <SheetFooter>
                    <Button
                        variant="outline"
                        disabled={submitting}
                        onClick={() =>
                            onOpenChange(false)
                        }
                    >
                        Cancel
                    </Button>

                    <Button
                        disabled={
                            submitting ||
                            !valid
                        }
                        onClick={
                            handleSubmit
                        }
                    >
                        {submitting ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : !isEditing ? (
                            <Plus className="mr-2 size-4" />
                        ) : null}

                        {isEditing
                            ? "Save Changes"
                            : "Create Word"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

export default WordEditor;