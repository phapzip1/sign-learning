import {
    columnVisibilityFeature,
    createPaginatedRowModel,
    rowPaginationFeature,
    rowSelectionFeature,
    tableFeatures
} from "@tanstack/react-table";


const baseTableFeatures = tableFeatures({
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

export {
    baseTableFeatures,
}