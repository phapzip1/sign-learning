import { useEffect, useState } from "react";

import {
  Eye,
  Lightbulb,
  Loader2,
  Plus,
} from "lucide-react";

import { useAuth } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";


import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Textarea,
} from "@/components/ui/textarea";
import { WORD_LEVELS, WordLevel } from "@/src/types/word.type";
import { CreateSuggestionPayload, SuggestionStatus, WordSuggestion } from "@/src/types/suggestion.type";
import { createSuggestion, getSuggestions } from "@/src/lib/api";
import { WORD_TOPICS } from "@/src/types/topic.type";


const emptyForm: CreateSuggestionPayload = {
  value: "",
  meaning: "",
  level: "Beginner",
  topic: 7,
  demoURL: "",
  instruction: "",
  note: "",
};


const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

const Detail: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => {
  return (
    <div>
      <p className="text-sm font-medium">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
        {value}
      </p>
    </div>
  );
}

const StatusBadge: React.FC<{
  status: SuggestionStatus
}> = ({ status }) => {
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

const ViewSuggestionSheet: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: WordSuggestion | null;
}> = ({ open, onOpenChange, suggestion }) => {
  if (!suggestion)
    return null;

  const topic = WORD_TOPICS.find((item) => item.name === suggestion.topic);

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
          <div className="flex items-center justify-between gap-4">

            <div>
              <SheetTitle>
                {
                  suggestion.value
                }
              </SheetTitle>

              <SheetDescription>
                Submitted{" "}
                {formatDate(
                  suggestion.createdAt
                )}
              </SheetDescription>
            </div>

            <StatusBadge
              status={
                suggestion.status
              }
            />

          </div>
        </SheetHeader>

        <div className="grid gap-6 px-4 py-6">

          <Detail
            label="Meaning"
            value={
              suggestion.meaning
            }
          />

          <div className="grid grid-cols-2 gap-4">

            <Detail
              label="Level"
              value={
                suggestion.level
              }
            />

            <Detail
              label="Topic"
              value={topic?.name ?? "Invalid"}
            />

          </div>

          {suggestion.demoURL && (
            <Detail
              label="Demo URL"
              value={
                suggestion.demoURL
              }
            />
          )}

          {suggestion.instruction && (
            <Detail
              label="Instruction"
              value={
                suggestion.instruction
              }
            />
          )}

          {suggestion.note && (
            <Detail
              label="Your Note"
              value={
                suggestion.note
              }
            />
          )}

          {suggestion.reviewNote && (
            <div className="rounded-lg border bg-muted/30 p-4">

              <p className="text-sm font-medium">
                Review Note
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {
                  suggestion.reviewNote
                }
              </p>

            </div>
          )}

          {
            suggestion.status === "Approved" &&
            suggestion.approvedWordId && (
              <div className="rounded-lg border p-4">

                <p className="text-sm font-medium">
                  Approved
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  This suggestion was
                  added to the
                  dictionary as Word #
                  {
                    suggestion.approvedWordId
                  }.
                </p>

              </div>
            )}

        </div>

      </SheetContent>
    </Sheet>
  );
}

const CreateSuggestionSheet: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}> = ({ open, onOpenChange, onCreated, }) => {
  const { getToken } = useAuth();

  const [form, setForm] = useState<CreateSuggestionPayload>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const valid = form.value.trim().length > 0 && form.meaning.trim().length > 0;

  const handleOpenChange = (value: boolean) => {
    onOpenChange(value);

    if (!value) {
      setForm(emptyForm);
    }
  };

  const handleSubmit = async () => {
    if (!valid)
      return;

    const token = await getToken();

    if (!token)
      return;

    setSubmitting(true);

    try {
      await createSuggestion(
        {
          value: form.value.trim(),
          meaning: form.meaning.trim(),
          level: form.level,
          topic: form.topic,
          demoURL: form.demoURL?.trim() || undefined,
          instruction: form.instruction?.trim() || undefined,
          note: form.note?.trim() || undefined,
        },
        token
      );

      setForm(emptyForm);

      onOpenChange(false);

      onCreated?.();
    }
    catch (error) {
      console.error("Unable to create suggestion", error);
    }
    finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={
        handleOpenChange
      }
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-xl min-w-130"
      >

        <SheetHeader>
          <SheetTitle>
            Suggest a Word
          </SheetTitle>

          <SheetDescription>
            Submit a word for review.
            An admin will review it
            before it is added to the
            dictionary.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-5 px-4 py-6">

          <div className="grid gap-2">

            <Label htmlFor="suggestion-word">
              Word
            </Label>

            <Input
              id="suggestion-word"
              value={
                form.value
              }
              placeholder="Computer"
              onChange={(e) => setForm({
                ...form,
                value: e.target.value,
              })
              }
            />

          </div>

          <div className="grid gap-2">

            <Label htmlFor="suggestion-meaning">
              Meaning
            </Label>

            <Textarea
              id="suggestion-meaning"
              value={
                form.meaning
              }
              placeholder="What does this word mean?"
              rows={3}
              onChange={(e) => setForm({
                ...form,
                meaning: e.target.value,
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
                value={form.level}
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
                  {
                    WORD_LEVELS.map((level) => (
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

          <div className="grid gap-2">

            <Label htmlFor="suggestion-demo">
              Demo URL
              <span className="ml-1 text-muted-foreground">
                (optional)
              </span>
            </Label>

            <Input
              id="suggestion-demo"
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

            <Label htmlFor="suggestion-instruction">
              Instruction
              <span className="ml-1 text-muted-foreground">
                (optional)
              </span>
            </Label>

            <Textarea
              id="suggestion-instruction"
              value={
                form.instruction
              }
              rows={5}
              placeholder="Describe how the sign is performed..."
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

            <Label htmlFor="suggestion-note">
              Note
              <span className="ml-1 text-muted-foreground">
                (optional)
              </span>
            </Label>

            <Textarea
              id="suggestion-note"
              value={
                form.note
              }
              rows={3}
              placeholder="Anything else the reviewer should know?"
              onChange={(e) =>
                setForm({
                  ...form,
                  note:
                    e.target.value,
                })
              }
            />

          </div>

        </div>

        <SheetFooter>

          <Button
            variant="outline"
            disabled={
              submitting
            }
            onClick={() =>
              handleOpenChange(
                false
              )
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
            ) : (
              <Lightbulb className="mr-2 size-4" />
            )}

            Submit Suggestion
          </Button>

        </SheetFooter>

      </SheetContent>
    </Sheet>
  );
}

const SuggestionsTab = () => {
  const { getToken } = useAuth();

  const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<WordSuggestion | null>(null);

  const [viewOpen, setViewOpen] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions =
    async () => {
      setLoading(true);

      try {
        const token = await getToken();

        if (!token)
          return;

        const result = await getSuggestions(token);

        setSuggestions(
          result
        );
      }
      catch (error) {
        console.error(
          "Unable to load suggestions",
          error
        );
      }
      finally {
        setLoading(false);
      }
    };

  const openSuggestion = (suggestion: WordSuggestion) => {
    setSelected(suggestion);

    setViewOpen(true);
  };

  const handleViewOpenChange = (open: boolean) => {
    setViewOpen(open);

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
                Suggest new words and
                track their review
                status.
              </CardDescription>
            </div>

            <Button
              onClick={() =>
                setCreateOpen(
                  true
                )
              }
            >
              <Plus className="mr-2 size-4" />

              New Suggestion
            </Button>

          </div>
        </CardHeader>

        <CardContent>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">

              <Loader2 className="size-6 animate-spin text-muted-foreground" />

            </div>
          ) : suggestions.length ===
            0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">

              <Lightbulb className="mb-3 size-9 text-muted-foreground" />

              <p className="font-medium">
                No suggestions yet
              </p>

              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Suggest a word you
                would like to see added
                to the dictionary.
              </p>

              <Button
                className="mt-4"
                onClick={() =>
                  setCreateOpen(
                    true
                  )
                }
              >
                <Plus className="mr-2 size-4" />

                Suggest a Word
              </Button>

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

                    <TableHead className="w-20" />

                  </TableRow>
                </TableHeader>

                <TableBody>
                  {
                    suggestions.map((suggestion) => {
                      const topic = WORD_TOPICS.find((t) => t.name === suggestion.topic);

                      return (
                        <TableRow
                          key={suggestion.id}
                        >

                          <TableCell className="font-medium">
                            {
                              suggestion.value
                            }
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
                            {
                              topic?.value ??
                              "Other"
                            }
                          </TableCell>

                          <TableCell>
                            {formatDate(suggestion.createdAt)}
                          </TableCell>

                          <TableCell>
                            <StatusBadge
                              status={suggestion.status}
                            />
                          </TableCell>

                          <TableCell>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                openSuggestion(suggestion)
                              }
                            >
                              <Eye className="size-4" />

                              <span className="sr-only">
                                View suggestion
                              </span>
                            </Button>

                          </TableCell>

                        </TableRow>
                      );
                    }
                    )}

                </TableBody>

              </Table>

            </div>
          )}

        </CardContent>

      </Card>

      <CreateSuggestionSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={loadSuggestions}
      />

      <ViewSuggestionSheet
        open={viewOpen}
        onOpenChange={handleViewOpenChange}
        suggestion={selected}
      />
    </>
  );
}

export const Route = createFileRoute("/me/suggestions")({
  component: SuggestionsTab,
});
