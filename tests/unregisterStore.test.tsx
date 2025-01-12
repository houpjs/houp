import { act, configure, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
    configure({ reactStrictMode: Boolean(process.env.TEST_STRICT_MODE) });
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
        const { StandaloneStore, } = await import("houp/store");
        const { StoreProvider } = await import("../src/provider/storeProvider");
        const store = new StandaloneStore();
        // const store = await act(async () => createStoreInternal(true));
        const user = userEvent.setup();
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
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
                </>
            );
        }
        const { rerender } = await act(async () => render(
            <>
                <StoreProvider store={store} />
                <Component />
            </>
        ));
        await screen.findByText("value:0");
        await user.click(screen.getByTestId("button"));
        await screen.findByText("value:1");
        await act(async () => store.unregisterStore(hook));
        await act(async () => rerender(
            <>
                <StoreProvider store={store} />
                <Component />
            </>
        ));
        expect(consoleSpy).toBeCalledWith("The store (hook) has been unmounted. Please file an issue at https://github.com/houpjs/houp/issues if you encounter this warning.");
        // test syncStoreImpl
        await act(async () => rerender(null));
        try {
            await act(async () => rerender(
                <>
                    <StoreProvider store={store} />
                    <Component />
                </>
            ));
            assert.fail("should throw error");
        } catch (error) {
            expect((error as Error).message).toBe("The store (hook) has not been registered yet. Did you forget to call registerStore to register it?");
        }
    })

})
