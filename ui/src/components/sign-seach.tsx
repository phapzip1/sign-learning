/**
 * "Search by sign" dialog: records a short clip from the webcam, sends it to the
 * recognition service and lets the learner pick the intended sign from the top matches.
 * The camera only starts on request and every track is stopped on close or unmount.
 */

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
import { toApiError } from "@/src/lib/errors";

// Preferred recording format first; the browser default is used when none is supported.
const MIME_TYPES = ["video/mp4; codecs=vp9", "video/webm; codecs=vp9", "video/webm"];

const MAX_RECORD_MS = 10000;

/** Reasons the camera could not be used, each with its own message. */
type CameraProblem =
    | "unsupported"
    | "insecure"
    | "denied"
    | "no-device"
    | "busy"
    | "failed";

const CAMERA_MESSAGES: Record<CameraProblem, string> = {
    unsupported: "Your browser doesn't support camera recording. Try a recent version of Chrome, Edge, Firefox or Safari.",
    insecure: "The camera only works on a secure (https) page. Open the site over https and try again.",
    denied: "Camera access was blocked. Allow camera access for this site in your browser settings, then try again.",
    "no-device": "We couldn't find a camera. Connect one and try again.",
    busy: "Your camera is being used by another app. Close it and try again.",
    failed: "We couldn't start your camera. Please try again.",
};

/** Maps a getUserMedia error to a CameraProblem. */
const cameraProblemFrom = (error: unknown): CameraProblem => {
    const name = error instanceof DOMException ? error.name : "";

    if (name === "NotAllowedError" || name === "SecurityError") return "denied";
    if (name === "NotFoundError" || name === "OverconstrainedError") return "no-device";
    if (name === "NotReadableError" || name === "AbortError") return "busy";
    return "failed";
}

/** First supported recording format, or undefined for the browser default. */
const pickMimeType = () =>
    MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));

// The inference service returns its top-ranked labels with raw model scores.
// Scores aren't calibrated probabilities, so we only use them for ordering and
// let the user pick the sign they meant.
/** Orders the recognition result by score and drops labels missing from the label map. */
const rankCandidates = (result: Record<string, number>) =>
    Object.entries(result)
        .filter(([label]) => !label.startsWith("Unknown:"))
        .sort((a, b) => b[1] - a[1])
        .map(([label]) => label);

/** Dialog state: camera off, starting, ready, recording, or waiting for recognition. */
type Phase = "idle" | "starting" | "ready" | "recording" | "searching";

/**
 * Button that opens the sign search dialog.
 * @param onSelect Called with the sign label the learner picked.
 */
const SignSearch: React.FC<{
    onSelect?: (word: string) => void;
}> = ({ onSelect }) => {
    const [open, setOpen] = React.useState(false);
    const [phase, setPhase] = React.useState<Phase>("idle");
    const [cameraProblem, setCameraProblem] = React.useState<CameraProblem | null>(null);
    const [searchError, setSearchError] = React.useState<string | null>(null);
    const [candidates, setCandidates] = React.useState<string[] | null>(null);

    const videoRef = React.useRef<HTMLVideoElement>(null);
    const streamRef = React.useRef<MediaStream | null>(null);
    const recorderRef = React.useRef<MediaRecorder | null>(null);
    const recordTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    // Bumped whenever the dialog closes so late results from an old session are ignored.
    const sessionRef = React.useRef(0);

    const stopCamera = React.useCallback(() => {
        sessionRef.current++;

        if (recordTimer.current) {
            clearTimeout(recordTimer.current);
            recordTimer.current = null;
        }

        const recorder = recorderRef.current;
        recorderRef.current = null;

        if (recorder && recorder.state !== "inactive") {
            // Discard the partial clip instead of uploading it.
            recorder.ondataavailable = null;
            recorder.stop();
        }

        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setPhase("idle");
    }, []);

    // Release the camera if the component unmounts (e.g. navigation) while open.
    React.useEffect(() => stopCamera, [stopCamera]);

    const startCamera = async () => {
        setCameraProblem(null);
        setSearchError(null);
        setCandidates(null);

        if (!window.isSecureContext) {
            setCameraProblem("insecure");
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
            setCameraProblem("unsupported");
            return;
        }

        const session = sessionRef.current;
        setPhase("starting");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });

            // The dialog was closed while the permission prompt was showing.
            if (session !== sessionRef.current) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setPhase("ready");
        } catch (error) {
            if (session !== sessionRef.current)
                return;

            setCameraProblem(cameraProblemFrom(error));
            setPhase("idle");
        }
    }

    const search = async (clip: Blob, session: number) => {
        setPhase("searching");

        try {
            const result = await searchBySign([clip]);

            if (session !== sessionRef.current)
                return;

            setCandidates(rankCandidates(result));
        } catch (error) {
            if (session !== sessionRef.current)
                return;

            setSearchError(toApiError(error).message);
        }

        setPhase(streamRef.current ? "ready" : "idle");
    }

    const stopRecord = () => {
        if (recordTimer.current) {
            clearTimeout(recordTimer.current);
            recordTimer.current = null;
        }

        const recorder = recorderRef.current;
        recorderRef.current = null;

        if (recorder && recorder.state !== "inactive") {
            recorder.stop();
        }
    }

    const startRecord = () => {
        const stream = streamRef.current;

        if (!stream || recorderRef.current)
            return;

        setSearchError(null);
        setCandidates(null);

        const session = sessionRef.current;
        const mimeType = pickMimeType();
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

        recorder.ondataavailable = (ev: BlobEvent) => {
            if (ev.data.size > 0) {
                search(ev.data, session);
            } else {
                setPhase("ready");
            }
        };

        recorder.start();
        recorderRef.current = recorder;
        recordTimer.current = setTimeout(stopRecord, MAX_RECORD_MS);
        setPhase("recording");
    }

    const onOpenChange = (next: boolean) => {
        setOpen(next);

        if (!next) {
            stopCamera();
        }
    }

    const choose = (word: string) => {
        onOpenChange(false);
        onSelect?.(word);
    }

    const recording = phase === "recording";
    const searching = phase === "searching";
    const cameraOn = phase === "ready" || recording || searching;

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
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
                        Turn on your camera, then record yourself signing one word (up to 10 seconds).
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                        Your camera only turns on when you choose to start it. The clip you record
                        is uploaded to our recognition server, which matches it against the dictionary
                        and deletes the clip afterwards. Nothing is recorded until you press Start recording.
                    </p>

                    <div className="relative overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
                        <video
                            className="w-full aspect-video scale-x-[-1] object-cover"
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            aria-label="Camera preview"
                        />
                        {!cameraOn && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                <Camera className="size-8" />
                                <p className="text-sm">
                                    {phase === "starting" ? "Waiting for camera access…" : "Camera is off"}
                                </p>
                            </div>
                        )}
                        {recording && (
                            <span className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                                <span className="size-2.5 animate-pulse rounded-full bg-red-500" />
                                Recording
                            </span>
                        )}
                        {searching && (
                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/70 font-semibold">
                                <Loader2 className="size-5 animate-spin text-primary" />
                                Finding your sign…
                            </div>
                        )}
                    </div>

                    <div aria-live="polite" className="flex flex-col gap-3">
                        {(cameraProblem || searchError) && (
                            <p className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                                <TriangleAlert className="size-4 shrink-0" />
                                {cameraProblem ? CAMERA_MESSAGES[cameraProblem] : searchError}
                            </p>
                        )}

                        {candidates && candidates.length === 0 && (
                            <p className="flex items-center gap-2 rounded-xl bg-highlight/25 px-3 py-2 text-sm font-medium text-highlight-foreground">
                                <TriangleAlert className="size-4 shrink-0" />
                                We couldn't recognize that sign. Try again with your hands clearly in view.
                            </p>
                        )}

                        {candidates && candidates.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <p className="text-sm font-semibold">
                                    Possible matches, most likely first. Pick the sign you meant:
                                </p>
                                <ul className="flex flex-wrap gap-2">
                                    {candidates.map((word) => (
                                        <li key={word}>
                                            <Button variant="outline" size="sm" onClick={() => choose(word)}>
                                                {word}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {
                        !cameraOn ? (
                            <Button
                                size="lg"
                                onClick={startCamera}
                                disabled={phase === "starting"}
                            >
                                {phase === "starting"
                                    ? <><Loader2 className="animate-spin" /> Starting camera…</>
                                    : <><Camera /> {cameraProblem ? "Try again" : "Start camera"}</>}
                            </Button>
                        ) : (
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    size="lg"
                                    className="flex-1"
                                    variant={recording ? "destructive" : "default"}
                                    onClick={recording ? stopRecord : startRecord}
                                    disabled={searching}
                                >
                                    {
                                        searching ?
                                            <><Loader2 className="animate-spin" /> Searching…</> :
                                            recording ?
                                                <><Square className="fill-current" /> Stop recording</> :
                                                <><Circle className="fill-current" /> Start recording</>
                                    }
                                </Button>
                                <Button size="lg" variant="outline" onClick={stopCamera}>
                                    Turn camera off
                                </Button>
                            </div>
                        )
                    }
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default SignSearch;
