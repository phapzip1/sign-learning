import { cn } from "cn";

type PageHeaderProps = {
    icon?: React.ComponentType<{ className?: string }>;
    title: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
};

const PageHeader: React.FC<PageHeaderProps> = ({
    icon: Icon,
    title,
    description,
    actions,
    className,
}) => {
    return (
        <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
            <div className="flex items-center gap-4">
                {Icon && (
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                        <Icon className="size-6" />
                    </div>
                )}
                <div>
                    <h1 className="text-2xl font-extrabold sm:text-3xl">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-1 text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}

export default PageHeader;
