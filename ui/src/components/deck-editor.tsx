import React from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { createCollection, updateCollection } from "@/src/lib/api";
import { useAuth } from "@clerk/tanstack-react-start";

const DeckEditor: React.FC<{
    onCompleted?: () => void;
    title?: string;
    description?: string;
    id?: string;
    trigger?: React.JSX.Element;
}> = ({ title, description, id, onCompleted, trigger }) => {
    const { getToken } = useAuth();
    const [loading, setLoading] = React.useState<boolean>(false);
    const [titleInput, setTitleInput] = React.useState<string>(title || "");
    const [descriptionInput, setDescriptionInput] = React.useState<string>(description || "");

    const confirm = async () => {
        if (id) {
            if (id.length === 0) {
                return;
            }
            setLoading(() => true);

            try {
                const token = await getToken();

                await updateCollection(id, { name: titleInput, description: descriptionInput }, `Bearer ${token}`);
                onCompleted?.();
            } catch (error) {
                console.error(error);
            }

            setLoading(() => false);
        }
        else {

            setLoading(() => true);

            try {
                const token = await getToken();

                await createCollection({ name: titleInput, description: descriptionInput }, `Bearer ${token}`);
                onCompleted?.();
            } catch (error) {
                console.error(error);
            }

            setLoading(() => false);
        }

    }

    return (
        <Sheet
        >
            <SheetTrigger render={trigger}>
                Open sheet

            </SheetTrigger>
            <SheetContent>
                <div className="flex flex-col gap-4 px-4">
                    <SheetHeader>
                        <SheetTitle>{id ? "Update your " : "Create new "} deck</SheetTitle>
                    </SheetHeader>
                    <Field>
                        <FieldLabel htmlFor="collection-title">
                            Title
                        </FieldLabel>
                        <Input
                            id="collection-title"
                            placeholder="Sample title"
                            value={titleInput}
                            onChange={e => setTitleInput(e.target.value)}
                            required
                        />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="collection-description">
                            Description
                        </FieldLabel>
                        <Input
                            id="collection-description"
                            placeholder="Sample description.."
                            value={descriptionInput}
                            onChange={e => setDescriptionInput(e.target.value)}
                            required
                        />
                    </Field>
                </div>
                <SheetFooter>
                    <Button
                        onClick={confirm}
                        disabled={loading}
                    >
                        {loading ? "Loading..." : "Confirm"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

export default DeckEditor;