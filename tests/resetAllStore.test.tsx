import { act, configure, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
    configure({ reactStrictMode: Boolean(process.env.TEST_STRICT_MODE) });
})

describe("resetAllStore", () => {
    it("should work in default store.", async () => {
        const { useStore, registerStore, resetAllStore } = await act(async () => await import("houp"));
        const user = userEvent.setup();
        function hook() {
            return useState(0);
        }
        function hook2() {
            return useState(0);
        }
        await act(async () => registerStore([hook, hook2]));
        const Component = () => {
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <div>value:{count}</div>
                    <button data-testid="button" onClick={() => setCount((c) => c + 1)}></button>
                    <button data-testid="button2" onClick={() => resetAllStore()}></button>
                </>
            );
        }
        const Component2 = () => {
            const [count, setCount] = useStore(hook2);
            return (
                <>
                    <div>value2:{count}</div>
                    <button data-testid="button3" onClick={() => setCount((c) => c + 1)}></button>
                </>
            );
        }
        await act(async () => render(
            <>
                <Component />
                <Component2 />
            </>
        ));
        await screen.findByText("value:0");
        await screen.findByText("value2:0");
        await user.click(screen.getByTestId("button"));
        await user.click(screen.getByTestId("button3"));
        await screen.findByText("value:1");
        await screen.findByText("value2:1");
        await user.click(screen.getByTestId("button2"));
        await screen.findByText("value:0");
        await screen.findByText("value2:0");
        await user.click(screen.getByTestId("button"));
        await user.click(screen.getByTestId("button3"));
        await screen.findByText("value:1");
        await screen.findByText("value2:1");
        await act(async () => resetAllStore());
        await screen.findByText("value:0");
        await screen.findByText("value2:0");
        await user.click(screen.getByTestId("button"));
        await user.click(screen.getByTestId("button3"));
        await screen.findByText("value:1");
        await screen.findByText("value2:1");
    })

    it("should work in standalone store.", async () => {
        const { createStoreInternal } = await import("houp/createStore");
        const store = await act(async () => createStoreInternal(true));
        const user = userEvent.setup();
        function hook() {
            return useState(0);
        }
        function hook2() {
            return useState(0);
        }
        await act(async () => store.registerStore([hook, hook2]));
        const Component = () => {
            const [count, setCount] = store.useStore(hook);
            return (
                <>
                    <div>value:{count}</div>
                    <button data-testid="button" onClick={() => setCount((c) => c + 1)}></button>
                    <button data-testid="button2" onClick={() => store.resetAllStore()}></button>
                </>
            );
        }
        const Component2 = () => {
            const [count, setCount] = store.useStore(hook2);
            return (
                <>
                    <div>value2:{count}</div>
                    <button data-testid="button3" onClick={() => setCount((c) => c + 1)}></button>
                </>
            );
        }
        await act(async () => render(
            <>
                <Component />
                <Component2 />
            </>
        ));
        await screen.findByText("value:0");
        await screen.findByText("value2:0");
        await user.click(screen.getByTestId("button"));
        await user.click(screen.getByTestId("button3"));
        await screen.findByText("value:1");
        await screen.findByText("value2:1");
        await user.click(screen.getByTestId("button2"));
        await screen.findByText("value:0");
        await screen.findByText("value2:0");
        await user.click(screen.getByTestId("button"));
        await user.click(screen.getByTestId("button3"));
        await screen.findByText("value:1");
        await screen.findByText("value2:1");
        await act(async () => store.resetAllStore());
        await screen.findByText("value:0");
        await screen.findByText("value2:0");
        await user.click(screen.getByTestId("button"));
        await user.click(screen.getByTestId("button3"));
        await screen.findByText("value:1");
        await screen.findByText("value2:1");
    })

})
