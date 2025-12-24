import { spawn } from "node:child_process";
export function runFFmpeg(args) {
    return new Promise((resolve, reject) => {
        const p = spawn("ffmpeg", args, { stdio: "inherit" });
        p.on("exit", (code) => code === 0 ? resolve() : reject(new Error("ffmpeg failed")));
    });
}
//# sourceMappingURL=ffmpeg.js.map