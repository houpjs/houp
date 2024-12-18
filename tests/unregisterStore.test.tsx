import { act, render } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
})

describe("unregisterStore", () => {
    it("nothing will happen if the hook has not been registered.", async () => {
        const { unregisterStore } = await import("houp");
        function hook() {
            const [count, setCount] = useState(0);
            return [count, setCount];
        }
        expect(() => unregisterStore(hook)).not.toThrow();
        expect(() => unregisterStore(() => { })).not.toThrow();
    })

    it("the hook can be unregistered before it is mounted.", async () => {
        const { registerStore, unregisterStore } = await import("houp");
        const { getHookMeta } = await import("houp/store");
        function hook() {
            const [count, setCount] = useState(0);
            return [count, setCount];
        }
        registerStore(hook);
        unregisterStore(hook);
        expect(getHookMeta(hook)).toBe(null);
    })

    it("The hook can be unregistered after it is mounted.", async () => {
        const { registerStore, unregisterStore, useStore, Provider } = await import("houp");
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        function hook() {
            return useState(0);
        }
        registerStore(hook);
        const Component = () => {
            const [count] = useStore(hook);
            return (
                <>
                    <div>value:{count}</div>
                </>
            );
        }
        const { rerender } = render(
            <>
                <Provider />
                <Component />
            </>
        );
        await act(async () => {
            unregisterStore(hook);
        });
        rerender(
            <>
                <Provider />
                <Component />
            </>);
        expect(consoleSpy).toBeCalledWith("The store(hook) has been unmounted from a Provider. This usually happens when a Provider has been unmounted, and you should not use a store registered to that Provider.");
        rerender(null);
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(() => rerender(<Component />)).toThrow("The store(hook) has not been registered yet. Did you forget to call registerStore(hook) to register?");;
    })
})
