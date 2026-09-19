import { Button, buttonVariants } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import React from "react";

const options = { mimeType: "video/webm; codecs=vp9" };

const SignSearch: React.FC = () => {
    const [stream, setStream] = React.useState<MediaStream | null>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
    const recordedData = React.useRef<{ timeout?: NodeJS.Timeout, data: Blob[] }>({
        data: []
    });

    const closeVideo = () => {
        if (stream) {
            for (const track of stream.getVideoTracks()) {
                track.stop();
            }

            setStream(() => null);
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
            console.error("Failed to start camera");
        }
    }

    const handleDataAvailable = (ev: BlobEvent) => {
        recordedData.current.data.push(ev.data);
    }


    const stopRecord = async () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            recordedData.current.data = [];

            if (recordedData.current.timeout) {
                clearTimeout(recordedData.current.timeout);
                recordedData.current.timeout = undefined;
            }



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
            });

            recordedData.current.timeout = handler;
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
                        className="w-full aspect-video border border-dashed"
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
                    >
                        {mediaRecorder ? "Stop recording" : "Start recording"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default SignSearch;