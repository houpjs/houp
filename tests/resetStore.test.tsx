import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
})

describe("resetStore", () => {
    it("should work in global store.", async () => {
        const { useStore, resetStore } = await act(async () => await import("houp"));
        const user = userEvent.setup();
        function hook() {
            return useState(0);
        }
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
        const { createStoreInternal } = await import("houp/store");
        const store = await act(async () => createStoreInternal(true));
        const user = userEvent.setup();
        function hook() {
            return useState(0);
        }
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
