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
import { MOCKWORDS } from "@/src/lib/mock";
import SignSearch from "@/src/components/sign-seach";

const DictionaryPage: React.FC = () => {

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
                                >
                                    Clear all
                                </Button>
                            </SidebarHeader>
                            <SidebarContent>
                                <SidebarGroup>
                                    <SidebarGroupLabel>
                                        Category
                                    </SidebarGroupLabel>
                                    <SidebarGroupContent>
                                        <Combobox>
                                            <ComboboxInput placeholder="All category" className="mb-2" readOnly />
                                            <ComboboxContent>
                                                <ComboboxEmpty>No items found.</ComboboxEmpty>
                                                <ComboboxList>
                                                    {(item) => (
                                                        <ComboboxItem key={item} value={item}>
                                                            {item}
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
                                            <Field orientation="horizontal">
                                                <Checkbox id="beginner-checkbox" name="beginner-checkbox" />
                                                <Label htmlFor="beginner-checkbox">Beginner</Label>
                                            </Field>
                                            <Field orientation="horizontal">
                                                <Checkbox id="intermediate-checkbox" name="intermediate-checkbox" />
                                                <Label htmlFor="intermediate-checkbox">Intermediate</Label>
                                            </Field><Field orientation="horizontal">
                                                <Checkbox id="advance-checkbox" name="advance-checkbox" />
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
                                        <RadioGroup defaultValue="comfortable" className="w-fit">
                                            <div className="flex items-center gap-3">
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
                                            </div>
                                        </RadioGroup>
                                    </SidebarGroupContent>
                                </SidebarGroup>
                            </SidebarContent>
                        </Sidebar>
                    </SidebarProvider>
                </CardContent>
            </Card>
            <Card className="rounded p-0 flex-7">
                <CardContent className="flex flex-col gap-4 py-4">
                    <div className="flex flex-row gap-4 items-center">
                        <Input
                            placeholder="Search for a word (e.g. hello, family, thank you, ...)"
                            className="w-full"
                        />
                        <Button className="rounded-md">
                            Search
                        </Button>
                        <span>or</span>
                        {/* <Button variant="secondary" className="rounded-md">
                            Search with signs
                        </Button> */}
                        <SignSearch />
                    </div>
                    <span className="inline">
                        Showing 24 results for
                        {" "}
                        <span className="font-medium">"{`${"Family"}`}"</span>
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                        {
                            MOCKWORDS.map((word) => {

                                return (
                                    <WordCard
                                        key={word.id}
                                        id={word.id}
                                        title={word.title}
                                        description={word.description}
                                        thumbnail={word.demo}
                                    />
                                );
                            })
                        }
                    </div>
                    
                </CardContent>
            </Card>
        </div>
    );
}

export const Route = createFileRoute("/dictionary/")({
    component: DictionaryPage,
});