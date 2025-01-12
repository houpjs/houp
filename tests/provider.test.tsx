import { configure, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
    configure({ reactStrictMode: Boolean(process.env.TEST_STRICT_MODE) });
})

describe("allow adding a provider before registering a store with it", () => {
    it("render one provider", async () => {
        const { StoreProvider } = await import("../src/provider/storeProvider");
        const { StandaloneStore } = await import("houp/store");
        const store = new StandaloneStore();
        const Provider = () => {
            return (
                <StoreProvider store={store}/>
            );
        }
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        render(
            <>
                <Provider />
            </>
        );
        expect(consoleSpy).not.toBeCalled();
    })
})

describe("a warning should be triggered if multiple StoreProvider components are mounted.", () => {
    it("render multiple provider", async () => {
        const { StoreProvider } = await import("../src/provider/storeProvider");
        const { StandaloneStore } = await import("houp/store");
        const store = new StandaloneStore();
        const Provider = () => {
            return (
                <StoreProvider store={store}/>
            );
        }
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        render(
            <>
                <Provider />
                <Provider />
            </>
        );
        expect(consoleSpy).toBeCalledWith("Multiple identical Providers are mounted. Please file an issue at https://github.com/houpjs/houp/issues if you encounter this warning.");
    })
})
