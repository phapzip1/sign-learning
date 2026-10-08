import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { WordLevel } from "@/src/types/word.type";

export const levelStyles: Record<WordLevel, string> = {
    Beginner: "bg-emerald-100 text-emerald-700",
    Intermediate: "bg-amber-100 text-amber-700",
    Advance: "bg-rose-100 text-rose-700",
};

const LevelBadge: React.FC<{
    level: WordLevel;
    className?: string;
}> = ({ level, className }) => {
    return (
        <Badge className={cn(levelStyles[level], className)}>
            {level}
        </Badge>
    );
}

export default LevelBadge;
