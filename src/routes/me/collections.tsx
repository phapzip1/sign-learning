import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Calendar, FileText, Plus, Search } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import WordTable from "@/src/components/word-table";
import { StoredWordItem } from "@/src/types/word.type";
import { MOCKCOLLECTIONS, MOCKSTOREDWORDS } from "@/src/lib/mock";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const FavoritesPage: React.FC = () => {
  const [selectedItem, setSelectedItem] = React.useState<StoredWordItem | null>(null);

  const onSelectRow = (item: StoredWordItem) => {
    if (!selectedItem || selectedItem.id === item.id) {
      setSelectedItem(() => item);
    }
  }

  return (
    <div className="flex flex-row gap-4 w-400 h-full">
      <Card className="p-0 rounded min-h-200 h-200">
        <CardContent className="flex flex-col py-2">
          <SidebarProvider
          >
            <Sidebar
              // variant="inset"
              className="bg-transparent "
              collapsible="none"
            >
              <SidebarHeader>
                <h3 className="text-2xl font-medium">Your collection</h3>
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <Button className="flex flex-row items-center justify-center gap-4">
                    <Plus />
                    New collection
                  </Button>
                </SidebarGroup>
                <Separator />
                <SidebarGroup>
                  <Input
                    placeholder="...Search collection"
                    className="border"
                    name="search-collection"
                  />
                </SidebarGroup>
                <Separator />
                <SidebarGroup
                  className="gap-2"
                >
                  <SidebarMenuButton
                    className="font-medium"
                    variant="outline"
                    isActive
                  >
                    ALL
                  </SidebarMenuButton>
                  {
                    MOCKCOLLECTIONS.map((collection) => {

                      return (
                        <SidebarMenuButton
                          key={collection.id}
                          className="font-medium"
                          variant="outline"
                        >
                          {collection.title}
                        </SidebarMenuButton>
                      );
                    })
                  }
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
          </SidebarProvider>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4 flex-1">
        <Card className="rounded p-0 min-h-40">
          <CardContent className="flex flex-row justify-between py-4 h-full">
            <div className="flex flex-col justify-between">
              <span>
                <h2 className="text-3xl font-semibold">
                  Title
                </h2>
                <p className="mt-2">Description</p>
              </span>
              <div className="flex flex-row gap-6 text-muted-foreground items-center">
                <span className="flex flex-row gap-2">
                  <FileText className="size-4.5" />
                  <p>12 words</p>
                </span>
                <span className="flex flex-row gap-2">
                  <Calendar className="size-4.5" />
                  <p>Updated 12:00 Aug 10, 2024</p>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded p-0 flex-1">
          <CardContent className="py-4">
            <div className="flex flex-row mb-4 gap-4">
              <Input
                className=""
                placeholder="Search words in this collection"
              />
            </div>
            <WordTable data={MOCKSTOREDWORDS} onSelectedItem={onSelectRow} />
          </CardContent>
        </Card>
      </div>
      <Sheet
        open={selectedItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedItem(() => null);
          }
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Are you absolutely sure?</SheetTitle>
            <SheetDescription>This action cannot be undone.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export const Route = createFileRoute("/me/collections")({
  component: FavoritesPage,
})
