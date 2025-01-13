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
})
