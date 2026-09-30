import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination";
import { cn } from "cn";

const getVisiblePages = (currentPage: number, totalPages: number): (number | "...")[] => {
    if (totalPages <= 7) {
        return Array.from(
            { length: totalPages },
            (_, i) => i + 1
        );
    }

    if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
        return [
            1,
            "...",
            totalPages - 4,
            totalPages - 3,
            totalPages - 2,
            totalPages - 1,
            totalPages,
        ];
    }

    return [
        1,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages,
    ];
}

const WordPagination: React.FC<{
    page: number;
    totalPages: number;
    onPageChange?: (page: number) => void;
    className?: string;
}> = ({ page, totalPages, onPageChange, className }) => {

    const pages = getVisiblePages(page, totalPages)

    return (
        <Pagination className={cn("mt-auto", className)}>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        aria-disabled={page === 1}
                        className={
                            page === 1
                                ? "pointer-events-none opacity-50"
                                : ""
                        }
                        onClick={(e) => {
                            e.preventDefault()

                            if (page > 1) {
                                onPageChange?.(page - 1)
                            }
                        }}
                    />
                </PaginationItem>

                {
                    pages.map((item, index) => {
                        if (item === "...") {
                            return (
                                <PaginationItem key={`ellipsis-${index}`}>
                                    <PaginationEllipsis />
                                </PaginationItem>
                            )
                        }

                        return (
                            <PaginationItem key={item}>
                                <PaginationLink
                                    href="#"
                                    isActive={item === page}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        onPageChange?.(item)
                                    }}
                                >
                                    {item}
                                </PaginationLink>
                            </PaginationItem>
                        )
                    })}

                <PaginationItem>
                    <PaginationNext
                        href="#"
                        aria-disabled={page === totalPages}
                        className={
                            page === totalPages
                                ? "pointer-events-none opacity-50"
                                : ""
                        }
                        onClick={(e) => {
                            e.preventDefault()

                            if (page < totalPages) {
                                onPageChange?.(page + 1)
                            }
                        }}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}

export default WordPagination;