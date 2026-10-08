import React from "react";
import { Camera, Circle, Loader2, Square, TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { searchBySign } from "@/src/lib/api";

const options = { mimeType: "video/mp4; codecs=vp9" };

const SignSearch: React.FC<{
    // Return false when no word could be matched, so the dialog can tell the user.
    onSearchComplete?: (keyword: Record<string, number>) => boolean | void;
}> = ({ onSearchComplete }) => {
    const [notFound, setNotFound] = React.useState(false);
    const [stream, setStream] = React.useState<MediaStream | null>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
    const recordTimer = React.useRef<NodeJS.Timeout | null>(null);

    const [loading, setLoading] = React.useState(false);


    const closeVideo = () => {
        if (stream) {
            for (const track of stream.getVideoTracks()) {
                track.stop();
            }

            setStream(() => null);
            setLoading(() => false);
        }
    }

    const openVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
            });

            videoRef.current!.srcObject = stream;
            setStream(() => stream);
        } catch (error) {
            console.error("Failed to start camera" + error);
        }
    }

    const handleDataAvailable = async (ev: BlobEvent) => {
        try {
            if (ev.data.size > 0) {
                const data = ev.data;

                setLoading(() => true);

                try {
                    const result = await searchBySign([data]);

                    setNotFound(onSearchComplete?.(result) === false);
                } catch (err: any) {
                    console.error(`Error calling API: ${err.message}`)
                }

            }


        } catch (err: any) {
            console.error(`Error calling API: ${err.message}`)
        }

        setLoading(() => false);
    }


    const stopRecord = async () => {
        if (mediaRecorder && !loading) {


            if (recordTimer.current) {
                clearTimeout(recordTimer.current);
                recordTimer.current = null;
            }

            mediaRecorder.stop();
            setMediaRecorder(() => null);

        }
    }
    const startRecord = async () => {
        if (stream && videoRef.current && !mediaRecorder) {

            setNotFound(false);
            const mr = new MediaRecorder(stream, options);
            mr.start();
            mr.ondataavailable = handleDataAvailable;
            const handler = setTimeout(() => {
                stopRecord();
            }, 10000);

            recordTimer.current = handler;
            setMediaRecorder(() => mr);
        }
    }


    return (
        <Dialog
            onOpenChange={(open) => {
                if (open) {
                    setNotFound(false);
                    openVideo();
                } else {
                    closeVideo();
                    stopRecord();
                }
            }}
            onOpenChangeComplete={(open) => {
                if (!open) {
                    stopRecord();
                    closeVideo();
                }
            }}
        >
            <DialogTrigger
                className={buttonVariants({ variant: "secondary" })}
            >
                <Camera />
                Search by sign
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Search with a sign 👋</DialogTitle>
                    <DialogDescription>
                        Sign a word in front of your camera. We'll record up to 10 seconds
                        and find the closest match in the dictionary.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <div className="relative overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
                        <video
                            className="w-full aspect-video scale-x-[-1] object-cover"
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                        />
                        {!stream && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                <Camera className="size-8" />
                                <p className="text-sm">Waiting for camera access…</p>
                            </div>
                        )}
                        {mediaRecorder && (
                            <span className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                                <span className="size-2.5 animate-pulse rounded-full bg-red-500" />
                                Recording
                            </span>
                        )}
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/70 font-semibold">
                                <Loader2 className="size-5 animate-spin text-primary" />
                                Finding your sign…
                            </div>
                        )}
                    </div>
                    {notFound && !mediaRecorder && !loading && (
                        <p className="flex items-center gap-2 rounded-xl bg-highlight/25 px-3 py-2 text-sm font-medium text-highlight-foreground">
                            <TriangleAlert className="size-4 shrink-0" />
                            We couldn't recognize that sign. Try again with your hands clearly in view.
                        </p>
                    )}
                    <Button
                        size="lg"
                        variant={mediaRecorder ? "destructive" : "default"}
                        onClick={() => {
                            if (mediaRecorder) {
                                stopRecord();
                            } else {
                                startRecord();
                            }
                        }}
                        disabled={loading}
                    >
                        {
                            loading ?
                                <><Loader2 className="animate-spin" /> Searching…</> :
                                mediaRecorder ?
                                    <><Square className="fill-current" /> Stop recording</> :
                                    <><Circle className="fill-current" /> Start recording</>
                        }
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default SignSearch;