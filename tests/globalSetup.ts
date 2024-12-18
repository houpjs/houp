import { configure } from "@testing-library/react";

export default function setup() {
    const strictMode = Boolean(process.env.TEST_STRICT_MODE);
    console.log(`React Strict Mode: ${strictMode ? "\x1b[42m\x1b[37m ON \x1b[0m" : "\x1b[41m\x1b[37m OFF \x1b[0m"}`);
    configure({
        reactStrictMode: strictMode,
    });
}