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
import { Topic, TOPICS } from "@/src/types/topic.type";
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

const DictionaryPage: React.FC = () => {
    const [category, setCategory] = React.useState<Topic>(TOPICS[0]);
    const [sort, setSort] = React.useState<number>(WORDSORTs[0].value);
    const [keyword, setKeyword] = React.useState<string>("");
    const [debouncedKeyword, setDebouncedKeyword] = React.useState<string>("");
    const [items, setItems] = React.useState<WordItem[]>([]);
    const [levels, setLevels] = React.useState<WordLevel[]>([...WORD_LEVELS]);
    const [loading, setLoading] = React.useState(true);
    const [failed, setFailed] = React.useState(false);
    const [pagitaion, setPagination] = React.useState({
        page: 1,
        totalPages: 0,
    });

    // Only the latest request is allowed to update the list.
    const requestId = React.useRef(0);

    const fetchWords = React.useCallback(async (pageIndex: number, search: string) => {
        const id = ++requestId.current;
        setLoading(true);
        setFailed(false);

        try {
            const { page, items, totalPages } = await getWordList({
                page: pageIndex,
                pageSize: PAGE_SIZE,
                topic: category.id !== 999 ? category.id : undefined,
                sortId: sort,
                levels: levels,
                search: search,
            });

            if (id !== requestId.current)
                return;

            setPagination(() => ({ page, totalPages }));
            setItems(items);
        } catch (error) {
            if (id !== requestId.current)
                return;

            console.error(error);
            setItems([]);
            setFailed(true);
        } finally {
            if (id === requestId.current)
                setLoading(false);
        }
    }, [category, sort, levels]);

    // Debounce typing so we don't fire a request on every keystroke.
    React.useEffect(() => {
        const handler = setTimeout(() => setDebouncedKeyword(keyword), 350);
        return () => clearTimeout(handler);
    }, [keyword]);

    // Reload from the first page whenever filters or the search keyword change.
    React.useEffect(() => {
        fetchWords(1, debouncedKeyword);
    }, [fetchWords, debouncedKeyword]);

    const search = () => {
        if (keyword === debouncedKeyword) {
            fetchWords(1, keyword);
        } else {
            // The effect above refetches once the keyword settles.
            setDebouncedKeyword(keyword);
        }
    }

    const reset = () => {
        setLevels(() => [...WORD_LEVELS]);
        setCategory(() => TOPICS[0]);
        setSort(() => WORDSORTs[0].value);
    }

    const toggleLevel = (level: WordLevel) => {
        setLevels((prev) => prev.includes(level)
            ? prev.filter((x) => x !== level)
            : [...prev, level]
        );
    }

    const onPageChanges = (pageIndex: number) => {
        fetchWords(pageIndex, debouncedKeyword);
    }

    const onSignSearch = (keywords: Record<string, number>) => {
        let val = null;
        let score = 0.0;
        for (const kw in keywords) {
            if (score < keywords[kw]) {
                val = kw;
                score = keywords[kw];
            }
        }

        if (!val || score < 4.5) {
            console.log("invalid sign");
            return false;
        }
        console.log(keywords);

        setKeyword(val);
        return true;
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
                                onClick={reset}
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
                                                onClick={() => setCategory(topic)}
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
                                        setSort(val as number);
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
                            />
                        </InputGroup>
                        <div className="flex items-center gap-2">
                            <Button type="submit" className="h-12 flex-1 sm:flex-none">
                                Search
                            </Button>
                            <span className="text-sm text-muted-foreground">or</span>
                            <SignSearch onSearchComplete={onSignSearch} />
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
                                        ? <Button onClick={search}>Try again</Button>
                                        : isFiltered && <Button variant="outline" onClick={reset}>Clear filters</Button>
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
                        items.length !== 0 && pagitaion.totalPages > 1 &&
                        <WordPagination
                            page={pagitaion.page}
                            totalPages={pagitaion.totalPages}
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
});
