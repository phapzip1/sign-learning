import { Show } from "@clerk/tanstack-react-start";
import { useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { cn } from "cn";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AddToCollectionButton from "@/src/components/add-to-collection-button";
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
    
    return (
        <Card className={cn("rounded p-0 items-stretch", className)}>
            <CardContent className="flex flex-col p-2 min-w-full max-w-70 h-full overflow-hidden">
                <div className="max-w-full">
                    <img
                        src={thumbnail}
                        className="min-w-full aspect-video object-contain"
                    />
                </div>
                <div className="flex flex-row justify-between items-center-safe gap-2 w-full">
                    <h4 className="text-lg font-medium">{title.charAt(0).toUpperCase() + title.slice(1)}</h4>
                    <span className="flex flex-row items-center gap-2">
                        <Badge >
                            {TOPICS.find(x => x.id === category)?.value.split(" ")[0]}
                        </Badge>
                        <Badge
                            className={cn(
                                "font-semibold rounded px-2",
                                level === "Beginner" && "bg-green-200 text-green-600",
                                level === "Intermediate" && "bg-orange-200 text-orange-600",
                                level === "Advance" && "bg-red-200 text-red-600",
                            )}
                        >
                            {level}
                        </Badge>
                    </span>
                </div>
                <p className="text-muted-foreground text-ellipsis">
                    {
                        description
                    }
                </p>
                <div className="flex flex-row justify-between items-center mt-auto">
                    <Show when="signed-in">
                        <AddToCollectionButton
                            wordId={id}
                            trigger={
                                <Button
                                    variant="ghost"
                                    className="flex flex-row items-center gap-2 rounded"
                                    size="icon"
                                >
                                    <Heart />
                                </Button>
                            }
                        />
                    </Show>
                    <Button
                        variant="outline"
                        className="rounded"
                        onClick={() => navigate({ to: "/dictionary/" + id })}
                    >
                        View detail
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default WordCard;