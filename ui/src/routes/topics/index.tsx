import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MOCKTOPICS, MOCKWORDS } from "@/src/lib/mock";
import WordCard from "@/src/components/word-card";

const filterOpts = [
  {
    id: "ascending",
    label: "A - Z",
  },
  {
    id: "descending",
    label: "Z - A",
  },
  {
    id: "newest",
    label: "Newest",
  },
  {
    id: "oldest",
    label: "Oldest",
  },
];


const TopicsPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 mt-6 mx-10 w-full">
      <h2 className="text-2xl font-semibold">
        Availble Topics
      </h2>
      <div className="flex flex-row gap-4">
        <div className="flex flex-col flex-1 gap-2">
          {
            MOCKTOPICS.map((topic) => {
              const Icon = topic.icon;
              return (
                <Button
                  id={topic.id}
                  variant="ghost"
                  className="flex flex-row rounded gap-4 py-6 text-lg font-medium justify-start"
                >
                  <Icon className="size-5 stroke-3" />
                  {topic.title}
                </Button>
              );
            })
          }
        </div>
        <Separator orientation="vertical" className="min-h-200" />
        <div className="flex flex-col flex-4 gap-4">
          <div className="flex flex-row gap-4">
            <Input
              placeholder="Type to search"
            />
            <Combobox
              items={filterOpts}
              itemToStringValue={(item: (typeof filterOpts)[number]) => item.label}
              defaultValue={filterOpts[0]}
            >
              <ComboboxInput placeholder="Select a framework" readOnly />
              <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.id} value={item}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {
              MOCKWORDS.map((word) => {

                return (
                  <WordCard
                    id={word.id}
                    thumbnail={word.video}
                    title={word.title}
                    description={word.description}

                  />
                );
              })
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/topics/")({
  component: TopicsPage,
});
