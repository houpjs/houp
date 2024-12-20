import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
})

describe("allow adding a provider before registering a store with it", () => {
    it("global provider", async () => {
        const { Provider } = await import("houp");
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
    it("namespaced provider", async () => {
        const { Provider } = await import("houp");
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        render(
            <>
                <Provider namespace="test" />
            </>
        );
        expect(consoleSpy).not.toBeCalled();
    })
})

describe("a warning should be triggered if multiple StoreProvider components are mounted.", () => {
    it("global provider", async () => {
        const { registerStore, Provider } = await import("houp");
        function useTest() {
            return 2;
        }
        registerStore(useTest);
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        render(
            <>
                <Provider />
                <Provider />
            </>
        );
        expect(consoleSpy).toBeCalledWith("Multiple identical Providers are mounted. Please ensure that each Provider is only mounted once to avoid potential unexpected behavior.");
    })
    it("namespaced provider", async () => {
        const { registerStore, Provider } = await import("houp");
        function useTest() {
            return 2;
        }
        registerStore(useTest, "test");
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        render(
            <>
                <Provider namespace="test" />
                <Provider namespace="test" />
            </>
        );
        expect(consoleSpy).toBeCalledWith("Multiple identical Providers are mounted. Please ensure that each Provider is only mounted once to avoid potential unexpected behavior.");
    })
})