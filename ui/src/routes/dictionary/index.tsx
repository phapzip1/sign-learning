import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldGroup, Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import WordCard from "@/src/components/word-card";
import { Card, CardContent } from "@/components/ui/card";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarProvider
} from "@/components/ui/sidebar";
import SignSearch from "@/src/components/sign-seach";
import { WordItem, WordLevel, WORDSORTs } from "@/src/types/word.type";
import { Topic, TOPICS } from "@/src/types/topic.type";
import WordPagination from "@/src/components/word-pagination";
import { getWordList } from "@/src/lib/api";

const DictionaryPage: React.FC = () => {
    const [category, setCategory] = React.useState<Topic>(TOPICS[0]);
    const [sort, setSort] = React.useState(WORDSORTs[0].value);
    const [keyword, setKeyword] = React.useState<string>("");
    const [items, setItems] = React.useState<WordItem[]>([]);
    const [levels, setLevels] = React.useState<WordLevel[]>(["Beginner", "Intermediate", "Advance"]);
    const [pagitaion, setPagination] = React.useState({
        page: 0,
        totalPages: 0,
    });

    const reset = () => {
        setLevels(() => ["Beginner", "Intermediate", "Advance"]);
        setCategory(() => TOPICS[0]);
        setSort(() => WORDSORTs[0].value);
    }

    const search = async () => {
        const { page, items, totalPages } = await getWordList({
            page: pagitaion.page,
            pageSize: 8,
            topic: category.id !== 999 ? category.id : undefined,
            sortId: sort,
            levels: levels,
            search: keyword,
        });

        setPagination(() => ({ page, totalPages }));
        setItems(items);

    }

    const onPageChanges = async (pageIndex: number) => {
        const { page, items, totalPages } = await getWordList({
            page: pageIndex,
            pageSize: 8,
            topic: category.id !== 999 ? category.id : undefined,
            sortId: sort,
            levels: levels,
            search: keyword,
        });

        setPagination(() => ({ page, totalPages }));
        setItems(items);
    }

    const onSignSearch = async (keywords: Record<string, number>) => {
        let val = null;
        let score = 0.0;
        for (const kw in keywords) {
            if (score < keywords[kw]) {
                val = kw;
                score = keywords[kw];
            }
        }
        
        if (!val || score < 4.5) {
            console.log("invalid sign");
            return;
        }
        console.log(keywords);
        
        setKeyword(val);
    }


    return (
        <div className="w-400 flex flex-row gap-4 px-5 mt-4">
            <Card className="p-0 rounded h-[80vh]">
                <CardContent>
                    <SidebarProvider>
                        <Sidebar
                            variant="inset"
                            collapsible="none"
                            className="bg-transparent px-2"
                        >
                            <SidebarHeader className="flex flex-row justify-between items-center">
                                <h3 className="text-xl font-semibold">Filters</h3>
                                <Button
                                    variant="ghost"
                                    className="rounded cursor-pointer"
                                    onClick={reset}
                                >
                                    Reset all
                                </Button>
                            </SidebarHeader>
                            <SidebarContent>
                                <SidebarGroup>
                                    <SidebarGroupLabel>
                                        Category
                                    </SidebarGroupLabel>
                                    <SidebarGroupContent>
                                        <Combobox
                                            defaultValue={TOPICS[0]}
                                            items={TOPICS}
                                            itemToStringValue={(item: Topic) => item.value}
                                            value={category}
                                            onValueChange={(val) => {
                                                setPagination((prev) => ({ ...prev, page: 1 }));
                                                setCategory(val!)
                                            }}

                                        >
                                            <ComboboxInput placeholder="All category" className="mb-2" readOnly />
                                            <ComboboxContent >
                                                <ComboboxEmpty>No items found.</ComboboxEmpty>
                                                <ComboboxList>
                                                    {(item: Topic) => (
                                                        <ComboboxItem key={item.id} value={item}>
                                                            {item.value}
                                                        </ComboboxItem>
                                                    )}
                                                </ComboboxList>
                                            </ComboboxContent>
                                        </Combobox>
                                    </SidebarGroupContent>
                                </SidebarGroup>
                                <Separator />
                                <SidebarGroup>
                                    <SidebarGroupLabel>
                                        Difficulty Level
                                    </SidebarGroupLabel>
                                    <SidebarGroupContent>
                                        <FieldGroup className="max-w-sm gap-4">
                                            <Field
                                                orientation="horizontal"
                                            >
                                                <Checkbox
                                                    id="beginner-checkbox"
                                                    name="beginner-checkbox"
                                                    checked={levels.indexOf("Beginner") !== -1}
                                                    onCheckedChange={(checked) => {
                                                        let newLevels;
                                                        if (checked) {
                                                            newLevels = [...levels, "Beginner"] satisfies WordLevel[];
                                                        } else {
                                                            newLevels = levels.filter((level) => level !== "Beginner")
                                                        }
                                                        setPagination((prev) => ({ ...prev, page: 1 }));
                                                        setLevels(() => newLevels);
                                                    }}
                                                />
                                                <Label htmlFor="beginner-checkbox">Beginner</Label>
                                            </Field>
                                            <Field orientation="horizontal">
                                                <Checkbox
                                                    id="intermediate-checkbox"
                                                    name="intermediate-checkbox"
                                                    checked={levels.indexOf("Intermediate") !== -1}
                                                    onCheckedChange={(checked) => {
                                                        let newLevels;
                                                        if (checked) {
                                                            newLevels = [...levels, "Intermediate"] satisfies WordLevel[];
                                                        } else {
                                                            newLevels = levels.filter((level) => level !== "Intermediate")
                                                        }
                                                        setPagination((prev) => ({ ...prev, page: 1 }));

                                                        setLevels(() => newLevels);

                                                    }}
                                                />
                                                <Label htmlFor="intermediate-checkbox">Intermediate</Label>
                                            </Field>
                                            <Field orientation="horizontal">
                                                <Checkbox
                                                    id="advance-checkbox"
                                                    name="advance-checkbox"
                                                    checked={levels.indexOf("Advance") !== -1}
                                                    onCheckedChange={(checked) => {
                                                        let newLevels;
                                                        if (checked) {
                                                            newLevels = [...levels, "Advance"] satisfies WordLevel[];
                                                        } else {
                                                            newLevels = levels.filter((level) => level !== "Advance")
                                                        }
                                                        setPagination((prev) => ({ ...prev, page: 1 }));
                                                        setLevels(() => newLevels);
                                                    }}
                                                />
                                                <Label htmlFor="advance-checkbox">Advance</Label>
                                            </Field>
                                        </FieldGroup>
                                    </SidebarGroupContent>
                                </SidebarGroup>
                                <Separator />
                                <SidebarGroup>
                                    <SidebarGroupLabel>
                                        Sort
                                    </SidebarGroupLabel>
                                    <SidebarGroupContent>
                                        <RadioGroup
                                            value={sort}
                                            onValueChange={(val) => setSort(val)}
                                            className="w-fit"
                                        >
                                            {
                                                WORDSORTs.map(val => {
                                                    return (
                                                        <div key={val.value} className="flex items-center gap-3">
                                                            <RadioGroupItem value={val.value} id={val.value.toString()} />
                                                            <Label htmlFor={val.value.toString()}>{val.label}</Label>
                                                        </div>
                                                    );
                                                })
                                            }
                                            {/* <div className="flex items-center gap-3">
                                                <RadioGroupItem value="most-relevant" id="r1" />
                                                <Label htmlFor="r1">Most relevant</Label>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <RadioGroupItem value="ascending" id="r2" />
                                                <Label htmlFor="r2">A - Z</Label>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <RadioGroupItem value="descending" id="r3" />
                                                <Label htmlFor="r3">Z - A </Label>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <RadioGroupItem value="newest" id="r4" />
                                                <Label htmlFor="r4">Newest</Label>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <RadioGroupItem value="oldest" id="r5" />
                                                <Label htmlFor="r5">Oldest</Label>
                                            </div> */}
                                        </RadioGroup>
                                    </SidebarGroupContent>
                                </SidebarGroup>
                            </SidebarContent>
                        </Sidebar>
                    </SidebarProvider>
                </CardContent>
            </Card>
            <Card className="rounded p-0 flex-7">
                <CardContent className="flex flex-col gap-4 py-4 min-h-full">
                    <div className="flex flex-row gap-4 items-center">
                        <Input
                            placeholder="Search for a word (e.g. hello, family, thank you, ...)"
                            className="w-full"
                            value={keyword}
                            onChange={(e) => {
                                setKeyword(e.target.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                        />
                        <Button className="rounded-md" onClick={search}>
                            Search
                        </Button>
                        <span>or</span>
                        {/* <Button variant="secondary" className="rounded-md">
                            Search with signs
                        </Button> */}
                        <SignSearch onSearchComplete={onSignSearch} />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {
                            items.map((word) => {

                                return (
                                    <WordCard
                                        key={word.id}
                                        id={word.id}
                                        title={word.title}
                                        description={word.description}
                                        thumbnail={word.cover}
                                        category={word.topic.id}
                                        level={word.level}
                                        className="min-h-90"
                                    />
                                );
                            })
                        }
                    </div>
                    {
                        items.length !== 0 &&
                        <WordPagination
                            page={pagitaion.page}
                            totalPages={pagitaion.totalPages}
                            onPageChange={onPageChanges}
                        />
                    }
                </CardContent>
            </Card>
        </div>
    );
}

export const Route = createFileRoute("/dictionary/")({
    component: DictionaryPage,
});