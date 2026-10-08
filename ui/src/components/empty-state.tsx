import { cn } from "cn";

type EmptyStateProps = {
    icon: React.ComponentType<{ className?: string }>;
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    action,
    className,
}) => {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed bg-card/60 px-6 py-14 text-center", className)}>
            <div className="relative mb-2">
                <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-highlight/30 blur-xl" />
                <div className="flex size-16 items-center justify-center rounded-3xl bg-secondary text-primary">
                    <Icon className="size-8" />
                </div>
            </div>
            <h3 className="text-lg font-bold">
                {title}
            </h3>
            {description && (
                <p className="max-w-sm text-muted-foreground">
                    {description}
                </p>
            )}
            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </div>
    );
}

export default EmptyState;
