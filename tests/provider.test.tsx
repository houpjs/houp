import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
})

describe("allow adding a provider before registering a store with it", () => {
    it("global provider", async () => {
        const { createProvider } = await import("../src/provider");
        const { StandaloneStore } = await import("houp/store");
        const store = new StandaloneStore();
        const Provider = createProvider(store);
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
    it("standalone provider", async () => {
        const { createProvider } = await import("../src/provider");
        const { StandaloneStore } = await import("houp/store");
        const store = new StandaloneStore();
        const Provider = createProvider(store);
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
    it("multiple provider", async () => {
        const { createProvider } = await import("../src/provider");
        const { StandaloneStore } = await import("houp/store");
        const store = new StandaloneStore();
        const Provider = createProvider(store);
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
