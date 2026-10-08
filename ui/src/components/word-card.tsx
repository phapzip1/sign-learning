import { Show } from "@clerk/tanstack-react-start";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Hand, Heart } from "lucide-react";
import { cn } from "cn";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AddToCollectionButton from "@/src/components/add-to-collection-button";
import LevelBadge from "@/src/components/level-badge";
import { TOPICS } from "@/src/types/topic.type";
import { WordLevel } from "@/src/types/word.type";

type WordCardProps = {
    id: number;
    thumbnail: string;
    description: string;
    category: number;
    level: WordLevel;
    className?: string;
    title: string;
};


const WordCard: React.FC<WordCardProps> = ({
    id,
    thumbnail,
    title,
    category,
    level,
    description,
    className,
}) => {
    const navigate = useNavigate();
    const topic = TOPICS.find(x => x.id === category)?.value.split(" ")[0];

    return (
        <Card className={cn("group/word gap-0 p-0 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10", className)}>
            <CardContent className="flex h-full flex-col gap-3 p-3">
                <button
                    type="button"
                    className="relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-secondary to-highlight/20"
                    onClick={() => navigate({ to: "/dictionary/" + id })}
                    aria-label={`View ${title}`}
                >
                    {
                        thumbnail
                            ? <img
                                src={thumbnail}
                                alt={title}
                                className="size-full object-contain transition-transform duration-300 group-hover/word:scale-105"
                            />
                            : <Hand className="size-10 text-primary/50" />
                    }
                </button>
                <div className="flex flex-col gap-2 px-1">
                    <h4 className="text-lg font-bold leading-tight">
                        {title.charAt(0).toUpperCase() + title.slice(1)}
                    </h4>
                    <span className="flex flex-wrap items-center gap-1.5">
                        {topic && (
                            <Badge variant="secondary">
                                {topic}
                            </Badge>
                        )}
                        <LevelBadge level={level} />
                    </span>
                    <p className="line-clamp-2 text-muted-foreground">
                        {description}
                    </p>
                </div>
                <div className="mt-auto flex flex-row items-center justify-between gap-2 px-1 pt-1">
                    <Show when="signed-in">
                        <AddToCollectionButton
                            wordId={id}
                            trigger={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                    aria-label="Add to a collection"
                                >
                                    <Heart className="size-5" />
                                </Button>
                            }
                        />
                    </Show>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="ml-auto"
                        onClick={() => navigate({ to: "/dictionary/" + id })}
                    >
                        View sign
                        <ArrowRight />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default WordCard;
