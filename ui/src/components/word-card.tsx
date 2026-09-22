import ReactPlayer from "react-player";
import { Heart } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { Show } from "@clerk/tanstack-react-start";

type WordCardProps = {
    id: number;
    thumbnail: string;
    title: string;
    description: string;
    className?: string;
}

const WordCard: React.FC<WordCardProps> = ({
    id,
    thumbnail,
    title,
    description,
    className,
}) => {
    const navigate = useNavigate();

    return (
        <Card className={cn("rounded p-0 items-stretch", className)}>
            <CardContent className="flex flex-col p-2 min-w-full max-w-70 overflow-hidden">
                <div className="w-full aspect-video">
                    <ReactPlayer
                        className="min-w-full"
                        src={thumbnail}
                        controls={false}

                    />
                </div>
                <div className="flex flex-row justify-between items-center-safe gap-2 w-full">
                    <h4 className="text-lg font-medium">Family</h4>
                    <span className="flex flex-row items-center gap-2">
                        <Badge>
                            Family
                        </Badge>
                        <Badge>
                            Beginner
                        </Badge>
                    </span>
                </div>
                <p className="text-muted-foreground text-ellipsis">
                    {
                        description
                    }
                </p>
                <div className="flex flex-row justify-between items-center mt-4">
                    <Show when="signed-in">
                        <Button
                            variant="ghost"
                            className="flex flex-row items-center gap-2 rounded"
                        >
                            <Heart />
                            Save
                        </Button>
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