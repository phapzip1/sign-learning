import React from "react";
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
    onSearchComplete?: (keyword: Record<string, number>) => void;
}> = ({ onSearchComplete }) => {
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

                    onSearchComplete?.(result);
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
                className={buttonVariants({ variant: "secondary", className: "rounded-md" })}
            >
                Search by sign
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Use sign to search</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove your data from our servers.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <video
                        className="w-full aspect-video border border-dashed scale-x-[-1]"
                        ref={videoRef}
                        autoPlay
                    />
                    <Button
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
                                "Loading..." :
                                mediaRecorder ?
                                    "Stop recording" :
                                    "Start recording"
                        }
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default SignSearch;