import {
    columnFilteringFeature,
    columnVisibilityFeature,
    createPaginatedRowModel,
    rowPaginationFeature,
    rowSelectionFeature,
    rowSortingFeature,
    tableFeatures
} from "@tanstack/react-table";


const baseTableFeatures = tableFeatures({
  columnVisibilityFeature,
  columnFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

export {
    baseTableFeatures,
}