import React from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { Heart } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Collection, RemoteCollection } from "@/src/types/collection.type";
import { addNewCards, belongCollection, createCollection, getCollections } from "@/src/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

const AddToCollectionButton: React.FC<{
    wordId: number;
    trigger?: React.JSX.Element
    className?: string;
}> = ({ wordId, trigger, className }) => {
    const { getToken } = useAuth();
    const [loading, setLoading] = React.useState(false);
    const [collections, setCollections] = React.useState<RemoteCollection[]>([]);
    const [inputs, setInputs] = React.useState<{ name: string; description: string }>({
        name: "",
        description: ""
    });
    const [wordCollection, setWordCollection] = React.useState<string | null>(null);

    const fetchCollections = async () => {
        try {
            setLoading(() => true);

            const token = await getToken();

            const data = await getCollections(`Bearer ${token}`);

            const belongTo = await belongCollection(wordId, `Bearer ${token}`);

            setWordCollection(() => belongTo);
            setCollections(() => data);

        } catch (error) {
            console.error(error);
        }

        setLoading(() => false);
    }

    const setInput = (kind: "name" | "description", value: string) => {
        switch (kind) {
            case "name":
                setInputs(prev => ({ ...prev, name: value }));
                break;
            case "description":
                setInputs(prev => ({ ...prev, description: value }));
                break;
            default:
                throw new Error("Invalid key");
        }
    }

    const onChangeCollection = async (wordId: number, collectionId: string) => {
        try {
            setLoading(() => true);
            const token = await getToken();

            const resp = await addNewCards(collectionId, [wordId], `Bearer ${token}`);
            
            await fetchCollections();
        } catch (error) {
            console.error(error);
        }
        setLoading(() => false);

    }

    const onOpen = async () => {
        await fetchCollections();
    }

    const onClosed = () => {

    }

    const onCreateCollection = async () => {
        try {
            setLoading(() => true);
            const token = await getToken();
            await createCollection({ ...inputs }, `Bearer ${token}`);
            fetchCollections();
        } catch (error) {
            console.error(error);
        }
        setLoading(() => false);

    }

    return (
        <Dialog
            onOpenChange={(open) => open ? onOpen() : onClosed()}
        >
            <DialogTrigger
                className={className}
                render={trigger}
            >
                <Heart />
                Add to a collection
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select a collection</DialogTitle>
                    <DialogDescription>
                    </DialogDescription>
                    <div className="flex flex-col gap-2">
                        <RadioGroup
                            onValueChange={(value: string) => onChangeCollection(wordId, value)}
                            value={wordCollection}
                        >
                            {
                                loading ? <p>Loading...</p>
                                    : collections.length !== 0
                                        ? collections.map(col => {

                                            return (
                                                <div key={col.id} className="flex items-center gap-3">
                                                    <RadioGroupItem  value={col.id} id={col.id} />
                                                    <Label htmlFor={col.id}>{col.name}</Label>
                                                </div>
                                            );
                                        })
                                        : <p>There is no collection</p>
                            }
                        </RadioGroup>

                    </div>
                    <DialogFooter>
                        <Dialog
                            onOpenChange={(open) => {
                                if (!open) {
                                    setInputs(() => ({ name: "", description: "" }))
                                }
                            }}
                        >
                            <DialogTrigger
                                render={
                                    <Button>
                                        Create New Collection
                                    </Button>
                                }
                            >

                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>Create a collection</DialogTitle>
                                <Field>
                                    <FieldLabel htmlFor="collection-name">
                                        Collection Name
                                    </FieldLabel>
                                    <Input
                                        id="collection-name"
                                        placeholder="Easy collection"
                                        required
                                        onChange={e => setInput("name", e.target.value)}
                                        value={inputs.name}
                                    />
                                    <FieldDescription>
                                        Enter your collection name
                                    </FieldDescription>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="collection-description">
                                        Collection Description
                                    </FieldLabel>
                                    <Input
                                        id="collection-description"
                                        placeholder="Purposes..."
                                        value={inputs.description}
                                        onChange={e => setInput("description", e.target.value)}
                                    />
                                    <FieldDescription>
                                        Enter your collection name
                                    </FieldDescription>
                                </Field>
                                <Button
                                    onClick={onCreateCollection}
                                    className="mt-4"
                                    disabled={loading}
                                >
                                    {loading ? "Waiting..." : "Confirm"}
                                </Button>
                            </DialogContent>
                        </Dialog>
                    </DialogFooter>
                </DialogHeader>
            </DialogContent>
        </Dialog >
    );
}

export default AddToCollectionButton;