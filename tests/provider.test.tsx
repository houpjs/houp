import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
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

describe("provider can handle namespace change correctly", () => {
    it("change namespace", async () => {
        const { registerStore, Provider, useStore } = await import("houp");
        const user = userEvent.setup();
        function useTest() {
            return useState(2);
        }
        registerStore(useTest, "test");
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        const Component = () => {
            const [count, setCount] = useStore(useTest);
            return (
                <>
                    <button data-testid="button" onClick={() => setCount((count) => count + 1)}></button>
                    <div>count:{count}</div>
                </>
            );
        }
        const { rerender } = render(
            <>
                <Provider namespace="test" />
                <Component />
            </>
        );
        await user.click(screen.getByTestId("button"));
        await screen.findByText("count:3");
        rerender(
            <>
                <Provider namespace="test2" />
                <Component />
            </>
        );
        await user.click(screen.getByTestId("button"));
        await screen.findByText("count:3");
        rerender(
            <>
                <Provider namespace="test2" />
                <Component />
            </>
        );
        expect(consoleSpy).toBeCalledWith("The store (useTest) has been unmounted from its Provider. This usually occurs when the Provider is unmounted, and you should avoid using a store that was registered to that Provider.");
    })
})