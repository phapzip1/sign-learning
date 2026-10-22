/**
 * "More signs in <topic>" section on word pages: other signs from the same topic,
 * easiest first. Loads on its own so a failure never breaks the word page.
 */

import React from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import WordCard from "@/src/components/word-card";
import { getWordList } from "@/src/lib/api";
import { Topic } from "@/src/types/topic.type";
import { WordItem, WORDSORTs } from "@/src/types/word.type";

const MAX_RELATED = 4;

// "Related" means other signs in the same topic, easiest first. The API has no
// dedicated related-words endpoint, so this reuses the dictionary's topic filter.
const RelatedWords: React.FC<{
    wordId: number;
    topic: Topic;
}> = ({ wordId, topic }) => {
    const [items, setItems] = React.useState<WordItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [failed, setFailed] = React.useState(false);
    const [reloadKey, setReloadKey] = React.useState(0);

    const isAll = topic.id === 999;

    React.useEffect(() => {
        if (isAll)
            return;

        let cancelled = false;

        setLoading(true);
        setFailed(false);

        getWordList({
            topic: topic.id,
            page: 1,
            // One extra, since the current word may be in the results.
            pageSize: MAX_RELATED + 1,
            sortId: WORDSORTs[2].value,
        })
            .then((result) => {
                if (cancelled)
                    return;

                setItems(result.items.filter((item) => item.id !== wordId).slice(0, MAX_RELATED));
            })
            .catch(() => {
                if (!cancelled)
                    setFailed(true);
            })
            .finally(() => {
                if (!cancelled)
                    setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [wordId, topic.id, isAll, reloadKey]);

    // Nothing meaningful to relate a word to without a topic.
    if (isAll || (!loading && !failed && items.length === 0))
        return null;

    return (
        <section aria-labelledby="related-signs" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 id="related-signs" className="flex items-center gap-2 text-2xl font-extrabold">
                    <Sparkles className="size-5 text-primary" />
                    {topic.id === 7 ? "More signs to explore" : `More signs in ${topic.value}`}
                </h2>
                {topic.id !== 7 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        render={
                            <Link to="/dictionary" search={{ topic: topic.id }}>
                                See all
                            </Link>
                        }
                    />
                )}
            </div>

            {
                loading ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: MAX_RELATED }, (_, i) => (
                            <Card key={i} className="gap-3 p-3">
                                <Skeleton className="aspect-video w-full" />
                                <Skeleton className="h-5 w-2/3" />
                                <Skeleton className="h-4 w-full" />
                            </Card>
                        ))}
                    </div>
                ) : failed ? (
                    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                        We couldn't load related signs.
                        <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
                            Try again
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {items.map((word) => (
                            <WordCard
                                key={word.id}
                                id={word.id}
                                title={word.title}
                                description={word.description}
                                thumbnail={word.cover}
                                category={word.topic.id}
                                level={word.level}
                            />
                        ))}
                    </div>
                )
            }
        </section>
    );
}

export default RelatedWords;
