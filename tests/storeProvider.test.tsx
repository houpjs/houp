import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
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
    it("standalone provider", async () => {
        const { registerStore, CreateProvider } = await import("houp");
        const MyProvider = CreateProvider();
        function useTest() {
            return 2;
        }
        registerStore(useTest, MyProvider);
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        render(
            <>
                <MyProvider />
                <MyProvider />
            </>
        );
        expect(consoleSpy).toBeCalledWith("Multiple identical Providers are mounted. Please ensure that each Provider is only mounted once to avoid potential unexpected behavior.");
    })
})