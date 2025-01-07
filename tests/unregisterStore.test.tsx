import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
})

describe("unregisterStore", () => {
    it("nothing will happen if the hook has not been registered.", async () => {
        const { StandaloneStore } = await import("houp/store");
        const store = new StandaloneStore();
        function hook() {
            const [count, setCount] = useState(0);
            return [count, setCount];
        }
        expect(() => store.unregisterStore(hook)).not.toThrow();
        expect(() => store.unregisterStore(() => { })).not.toThrow();
    })

    it("the hook can be unregistered before it is mounted.", async () => {
        const { StandaloneStore } = await import("houp/store");
        const store = new StandaloneStore();
        function hook() {
            const [count, setCount] = useState(0);
            return [count, setCount];
        }
        store.registerStore(hook);
        store.unregisterStore(hook);
        expect(store.getHookMeta(hook)).toBe(null);
    })

    it("different keys should be assigned if the unregistered hook register again.", async () => {
        const { StandaloneStore } = await import("houp/store");
        const store = new StandaloneStore();
        function hook() {
            const [count, setCount] = useState(0);
            return [count, setCount];
        }
        store.registerStore(hook);
        store.unregisterStore(hook);
        store.registerStore(hook);
        expect(store.getHookMeta(hook)?.key).toBe("hook1");
    })

    it("The hook can be unregistered after it is mounted.", async () => {
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
                    <button data-testid="button2" onClick={() => store.DO_NOT_USE_Unregister(hook)}></button>
                </>
            );
        }
        const { rerender } = await act(async () => render(
            <>
                <Component />
            </>
        ));
        await screen.findByText("value:0");
        await user.click(screen.getByTestId("button"));
        await screen.findByText("value:1");
        await act(async () => await user.click(screen.getByTestId("button2")));
        await act(async () => rerender(
            <>
                <Component />
            </>));
        await screen.findByText("value:0");
        await user.click(screen.getByTestId("button"));
        await screen.findByText("value:1");
        await act(async () => store.DO_NOT_USE_Unregister(hook));
        // test syncStoreImpl
        await act(async () => rerender(null));
        await act(async () => rerender(
            <>
                <Component />
            </>));
        await screen.findByText("value:0");
        await user.click(screen.getByTestId("button"));
        await screen.findByText("value:1");
    })

})
