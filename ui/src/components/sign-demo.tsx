import ReactPlayer from "react-player";
import { Config } from "react-player/types";
import { cn } from "@/lib/utils";

type SignDemoProps = {
    className?: string;
    src?: string;
}

const playerCfgs: Config = {
    youtube: {
        fs: 0
    },
}

const SignDemo: React.FC<SignDemoProps> = ({
    className,
    src
}) => {

    return (
        <div className={cn("w-full aspect-video", className)}>
            <ReactPlayer
                config={playerCfgs}
                src={src}
                className="min-w-full min-h-full"
                controls
                controlsList=""
            />
        </div>
    );
}

export default SignDemo;