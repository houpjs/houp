import { act, configure, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
    configure({ reactStrictMode: Boolean(process.env.TEST_STRICT_MODE) });
})

describe("resetStore", () => {
    it("should work in default store.", async () => {
        const { useStore, registerStore, resetStore } = await act(async () => await import("houp"));
        const user = userEvent.setup();
        function hook() {
            return useState(0);
        }
        await act(async () => registerStore(hook));
        const Component = () => {
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <div>value:{count}</div>
                    <button data-testid="button" onClick={() => setCount((c) => c + 1)}></button>
                    <button data-testid="button2" onClick={() => resetStore(hook)}></button>
                </>
            );
        }
        await act(async () => render(
            <>
                <Component />
            </>
        ));
        await screen.findByText("value:0");
        await user.click(screen.getByTestId("button"));
        await screen.findByText("value:1");
        await user.click(screen.getByTestId("button2"));
        await screen.findByText("value:0");
        await user.click(screen.getByTestId("button"));
        await screen.findByText("value:1");
        await act(async () => resetStore(hook));
        await screen.findByText("value:0");
        await user.click(screen.getByTestId("button"));
        await screen.findByText("value:1");
    })

    it("should work in standalone store.", async () => {
        const { createStoreInternal } = await import("houp/createStore");
        const store = await act(async () => createStoreInternal(true));
        const user = userEvent.setup();
        function hook() {
            return useState(0);
        }
        await act(async () => store.registerStore(hook));
        const Component = () => {
            const [count, setCount] = store.useStore(hook);
            return (
                <>
                    <div>value:{count}</div>
                    <button data-testid="button" onClick={() => setCount((c) => c + 1)}></button>
                    <button data-testid="button2" onClick={() => store.resetStore(hook)}></button>
                </>
            );
        }
        await act(async () => render(
            <>
                <Component />
            </>
        ));
        await screen.findByText("value:0");
        await user.click(screen.getByTestId("button"));
        await screen.findByText("value:1");
        await user.click(screen.getByTestId("button2"));
        await screen.findByText("value:0");
        await user.click(screen.getByTestId("button"));
        await screen.findByText("value:1");
        await act(async () => store.resetStore(hook));
        await screen.findByText("value:0");
        await user.click(screen.getByTestId("button"));
        await screen.findByText("value:1");
    })

})