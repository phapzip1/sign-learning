import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, RotateCcw, Search, SearchX } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import WordCard from "@/src/components/word-card";
import SignSearch from "@/src/components/sign-seach";
import PageHeader from "@/src/components/page-header";
import EmptyState from "@/src/components/empty-state";
import { levelStyles } from "@/src/components/level-badge";
import { WordItem, WordLevel, WORD_LEVELS, WORDSORTs } from "@/src/types/word.type";
import { Topic, TopicId, TOPICS, WORD_TOPICS } from "@/src/types/topic.type";
import WordPagination from "@/src/components/word-pagination";
import { getWordList } from "@/src/lib/api";

const PAGE_SIZE = 8;

const sortItems = WORDSORTs.map((sort) => ({ value: sort.value, label: sort.label }));

const FilterSection: React.FC<{
    title: string;
    children: React.ReactNode;
}> = ({ title, children }) => {
    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-muted-foreground">
                {title}
            </h3>
            {children}
        </div>
    );
}

type DictionarySearch = {
    q?: string;
    topic?: TopicId;
    levels?: WordLevel[];
    sort?: number;
    page?: number;
};

const validateDictionarySearch = (search: Record<string, unknown>): DictionarySearch => {
    const q = typeof search.q === "string" && search.q.trim() ? search.q : undefined;

    const topic = WORD_TOPICS.find((t) => t.id === Number(search.topic))?.id;

    const levels = Array.isArray(search.levels)
        ? WORD_LEVELS.filter((level) => (search.levels as unknown[]).includes(level))
        : undefined;

    const sort = WORDSORTs.find((s) => s.value === Number(search.sort))?.value;

    const page = Number(search.page);

    return {
        q,
        topic,
        // All levels selected is the default, so keep it out of the URL.
        levels: levels && levels.length !== WORD_LEVELS.length ? levels : undefined,
        sort: sort !== WORDSORTs[0].value ? sort : undefined,
        page: Number.isInteger(page) && page > 1 ? page : undefined,
    };
}

const DictionaryPage: React.FC = () => {
    const navigate = Route.useNavigate();
    const params = Route.useSearch();

    const query = params.q ?? "";
    const category: Topic = TOPICS.find((t) => t.id === params.topic) ?? TOPICS[0];
    const sort = params.sort ?? WORDSORTs[0].value;
    const levels = React.useMemo(() => params.levels ?? [...WORD_LEVELS], [params.levels]);
    const page = params.page ?? 1;

    // The text box is local so typing stays responsive; it is committed to the URL after a pause.
    const [keyword, setKeyword] = React.useState<string>(query);
    const [items, setItems] = React.useState<WordItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [failed, setFailed] = React.useState(false);
    const [totalPages, setTotalPages] = React.useState(0);
    // Bumped to refetch with unchanged params (retry, or re-submitting the same search).
    const [reloadKey, setReloadKey] = React.useState(0);

    const updateSearch = React.useCallback((patch: Partial<DictionarySearch>, resetPage = true) => {
        navigate({
            search: (prev) => validateDictionarySearch({
                ...prev,
                ...(resetPage ? { page: undefined } : {}),
                ...patch,
            }),
            replace: true,
        });
    }, [navigate]);

    // Keep the box in sync when the URL changes from outside (back/forward, sign search).
    React.useEffect(() => {
        setKeyword(query);
    }, [query]);

    // Only the latest request is allowed to update the list.
    const requestId = React.useRef(0);

    React.useEffect(() => {
        const id = ++requestId.current;
        setLoading(true);
        setFailed(false);

        getWordList({
            page,
            pageSize: PAGE_SIZE,
            topic: params.topic,
            sortId: sort,
            levels: levels,
            search: query,
        })
            .then((result) => {
                if (id !== requestId.current)
                    return;

                setTotalPages(result.totalPages);
                setItems(result.items);
            })
            .catch(() => {
                if (id !== requestId.current)
                    return;

                setItems([]);
                setFailed(true);
            })
            .finally(() => {
                if (id === requestId.current)
                    setLoading(false);
            });
    }, [page, params.topic, sort, levels, query, reloadKey]);

    // Debounce typing so we don't fire a request on every keystroke.
    React.useEffect(() => {
        if (keyword.trim() === query)
            return;

        const handler = setTimeout(() => updateSearch({ q: keyword.trim() || undefined }), 350);
        return () => clearTimeout(handler);
    }, [keyword, query, updateSearch]);

    // An explicit submit skips the debounce, and refetches if nothing changed.
    const search = () => {
        if (keyword.trim() === query) {
            setReloadKey((k) => k + 1);
        } else {
            updateSearch({ q: keyword.trim() || undefined });
        }
    }

    const retry = () => setReloadKey((k) => k + 1);

    const resetFilters = () => {
        updateSearch({ topic: undefined, levels: undefined, sort: undefined });
    }

    const clearAll = () => {
        setKeyword("");
        updateSearch({ q: undefined, topic: undefined, levels: undefined, sort: undefined });
    }

    const toggleLevel = (level: WordLevel) => {
        const next = levels.includes(level)
            ? levels.filter((x) => x !== level)
            : [...levels, level];

        updateSearch({ levels: next });
    }

    const onPageChanges = (pageIndex: number) => {
        updateSearch({ page: pageIndex }, false);
    }

    const onSignSearch = (word: string) => {
        setKeyword(word);
        updateSearch({ q: word });
    }

    const isFiltered = category.id !== TOPICS[0].id
        || sort !== WORDSORTs[0].value
        || levels.length !== WORD_LEVELS.length;

    return (
        <div className="flex w-full flex-col gap-6">
            <PageHeader
                icon={BookOpen}
                title="Dictionary"
                description="Explore signs by word, topic, or difficulty, or search by signing to your camera."
            />

            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                {/* Filters */}
                <Card className="h-fit lg:sticky lg:top-24" size="sm">
                    <CardContent className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-extrabold">Filters</h2>
                            <Button
                                variant="ghost"
                                size="xs"
                                onClick={resetFilters}
                                disabled={!isFiltered}
                            >
                                <RotateCcw />
                                Reset
                            </Button>
                        </div>

                        <FilterSection title="Topic">
                            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 [scrollbar-width:none] lg:flex-wrap lg:overflow-visible">
                                {
                                    TOPICS.map((topic) => {
                                        const active = topic.id === category.id;
                                        return (
                                            <button
                                                key={topic.id}
                                                type="button"
                                                aria-pressed={active}
                                                onClick={() => updateSearch({ topic: topic.id === 999 ? undefined : topic.id })}
                                                className={cn(
                                                    "shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                                                    active
                                                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                                                        : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                                                )}
                                            >
                                                {topic.value}
                                            </button>
                                        );
                                    })
                                }
                            </div>
                        </FilterSection>

                        <FilterSection title="Difficulty">
                            <div className="flex flex-wrap gap-2">
                                {
                                    WORD_LEVELS.map((level) => {
                                        const active = levels.includes(level);
                                        return (
                                            <button
                                                key={level}
                                                type="button"
                                                aria-pressed={active}
                                                onClick={() => toggleLevel(level)}
                                                className={cn(
                                                    "rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition-all",
                                                    active
                                                        ? cn(levelStyles[level], "ring-current/20")
                                                        : "bg-transparent text-muted-foreground ring-border line-through decoration-2 hover:bg-muted"
                                                )}
                                            >
                                                {level}
                                            </button>
                                        );
                                    })
                                }
                            </div>
                        </FilterSection>

                        <FilterSection title="Sort by">
                            <Select
                                items={sortItems}
                                value={sort}
                                onValueChange={(val) => {
                                    if (val != null)
                                        updateSearch({ sort: val as number });
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {
                                        sortItems.map((item) => (
                                            <SelectItem key={item.value} value={item.value}>
                                                {item.label}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </FilterSection>
                    </CardContent>
                </Card>

                {/* Results */}
                <div className="flex min-w-0 flex-col gap-5">
                    <form
                        className="flex flex-col gap-3 sm:flex-row sm:items-center"
                        onSubmit={(e) => {
                            e.preventDefault();
                            search();
                        }}
                    >
                        <InputGroup className="h-12 flex-1 bg-card">
                            <InputGroupAddon>
                                <Search className="size-5" />
                            </InputGroupAddon>
                            <InputGroupInput
                                placeholder="Search for a word (e.g. hello, family, thank you…)"
                                className="h-12 text-base"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                aria-label="Search the dictionary"
                            />
                        </InputGroup>
                        <div className="flex items-center gap-2">
                            <Button type="submit" className="h-12 flex-1 sm:flex-none">
                                Search
                            </Button>
                            <span className="text-sm text-muted-foreground">or</span>
                            <SignSearch onSelect={onSignSearch} />
                        </div>
                    </form>

                    {
                        loading ? (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {
                                    Array.from({ length: PAGE_SIZE }, (_, i) => (
                                        <Card key={i} className="gap-3 p-3">
                                            <Skeleton className="aspect-video w-full" />
                                            <Skeleton className="h-5 w-2/3" />
                                            <Skeleton className="h-4 w-1/2" />
                                            <Skeleton className="h-4 w-full" />
                                        </Card>
                                    ))
                                }
                            </div>
                        ) : items.length === 0 ? (
                            <EmptyState
                                icon={SearchX}
                                title={failed ? "Couldn't load signs" : "No signs found"}
                                description={
                                    failed
                                        ? "Something went wrong while loading the dictionary. Please try again."
                                        : "Try another word, or loosen your filters to see more signs."
                                }
                                action={
                                    failed
                                        ? <Button onClick={retry}>Try again</Button>
                                        : (isFiltered || query) && <Button variant="outline" onClick={clearAll}>Clear search and filters</Button>
                                }
                            />
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {
                                    items.map((word) => {
                                        return (
                                            <WordCard
                                                key={word.id}
                                                id={word.id}
                                                title={word.title}
                                                description={word.description}
                                                thumbnail={word.cover}
                                                category={word.topic.id}
                                                level={word.level}
                                            />
                                        );
                                    })
                                }
                            </div>
                        )
                    }
                    {
                        items.length !== 0 && totalPages > 1 &&
                        <WordPagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={onPageChanges}
                        />
                    }
                </div>
            </div>
        </div>
    );
}

export const Route = createFileRoute("/dictionary/")({
    component: DictionaryPage,
    validateSearch: validateDictionarySearch,
    head: () => ({
        meta: [{ title: "Dictionary · Sign Learning" }],
    }),
});
