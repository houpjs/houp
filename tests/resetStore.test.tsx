import { act, configure, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
    configure({ reactStrictMode: Boolean(process.env.TEST_STRICT_MODE) });
})

describe("resetStore", () => {

    it("should warning if hook have not been added in provider.", async () => {
        const { useStore, createProvider, useProvider } = await act(async () => await import("houp"));
        const user = userEvent.setup();
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        function hook() {
            return useState(0);
        }
        function hook2() {
            return useState(0);
        }
        const Provider = createProvider([hook]);
        const Component = () => {
            const [count,] = useStore(hook);
            const provider = useProvider(hook);
            return (
                <>
                    <div>value:{count}</div>
                    <button data-testid="button" onClick={() => provider.resetStore(hook2)}></button>
                </>
            );
        }
        await act(async () => render(
            <Provider>
                <Component />
            </Provider>
        ));
        await user.click(screen.getByTestId("button"));
        expect(consoleSpy).toBeCalledWith("Cannot reset the store (hook2) because it does not exist in the StoreProvider.");
    })

    it("should work fine.", async () => {
        const { useStore, createProvider, useProvider } = await act(async () => await import("houp"));
        const user = userEvent.setup();
        function hook() {
            return useState(0);
        }
        const Provider = createProvider([hook]);
        const Component = () => {
            const [count, setCount] = useStore(hook);
            const provider = useProvider(hook);
            return (
                <>
                    <div>value:{count}</div>
                    <button data-testid="button" onClick={() => setCount((c) => c + 1)}></button>
                    <button data-testid="button2" onClick={() => provider.resetStore(hook)}></button>
                </>
            );
        }
        await act(async () => render(
            <Provider>
                <Component />
            </Provider>
        ));
        await screen.findByText("value:0");
        await user.click(screen.getByTestId("button"));
        await screen.findByText("value:1");
        await user.click(screen.getByTestId("button2"));
        await screen.findByText("value:0");
        await user.click(screen.getByTestId("button"));
        await screen.findByText("value:1");
        await user.click(screen.getByTestId("button2"));
        await screen.findByText("value:0");
        await user.click(screen.getByTestId("button"));
        await screen.findByText("value:1");
    })

    it("reset specific store should not cause other store re-render.", async () => {
        const { useStore, createProvider, useProvider } = await act(async () => await import("houp"));
        const user = userEvent.setup();
        const reactStrictMode = Boolean(process.env.TEST_STRICT_MODE);
        function hook() {
            return useState(0);
        }
        function hook1() {
            return useState(0);
        }
        const Provider = createProvider([hook, hook1]);
        const render1 = vi.fn();
        const render2 = vi.fn();
        const Component = () => {
            render1();
            const [count, setCount] = useStore(hook);
            const provider = useProvider(hook);
            return (
                <>
                    <div>value:{count}</div>
                    <button data-testid="button" onClick={() => setCount((c) => c + 1)}></button>
                    <button data-testid="button2" onClick={() => provider.resetStore(hook)}></button>
                </>
            );
        }
        const Component2 = () => {
            render2();
            const [count, setCount] = useStore(hook1);
            const provider = useProvider(hook1);
            return (
                <>
                    <div>value-2:{count}</div>
                    <button data-testid="button-2" onClick={() => setCount((c) => c + 1)}></button>
                    <button data-testid="button2-2" onClick={() => provider.resetStore(hook1)}></button>
                </>
            );
        }
        await act(async () => render(
            <Provider>
                <Component />
                <Component2 />
            </Provider>
        ));
        expect(render1).toBeCalledTimes(reactStrictMode ? 2 : 1);
        expect(render2).toBeCalledTimes(reactStrictMode ? 2 : 1);
        await screen.findByText("value:0");
        await screen.findByText("value-2:0");
        await user.click(screen.getByTestId("button"));
        expect(render1).toBeCalledTimes(reactStrictMode ? 4 : 2);
        expect(render2).toBeCalledTimes(reactStrictMode ? 2 : 1);
        await screen.findByText("value:1");
        await screen.findByText("value-2:0");
        await user.click(screen.getByTestId("button2"));
        expect(render1).toBeCalledTimes(reactStrictMode ? 6 : 3);
        expect(render2).toBeCalledTimes(reactStrictMode ? 2 : 1);
        await screen.findByText("value:0");
        await screen.findByText("value-2:0");
        await user.click(screen.getByTestId("button-2"));
        expect(render1).toBeCalledTimes(reactStrictMode ? 6 : 3);
        expect(render2).toBeCalledTimes(reactStrictMode ? 4 : 2);
        await screen.findByText("value:0");
        await screen.findByText("value-2:1");
        await user.click(screen.getByTestId("button2-2"));
        expect(render1).toBeCalledTimes(reactStrictMode ? 6 : 3);
        expect(render2).toBeCalledTimes(reactStrictMode ? 6 : 3);
        await screen.findByText("value:0");
        await screen.findByText("value-2:0");
    })
})
