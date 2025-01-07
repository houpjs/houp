import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
})

describe("registerStore - function with name", () => {
    it("there shouldn't be a warning if the same hook is registered to different store.", async () => {
        const { StandaloneStore } = await import("houp/store");
        const store1 = new StandaloneStore();
        const store2 = new StandaloneStore();
        function hook() {
            const [count, setCount] = useState(0);
            return [count, setCount];
        }
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        store1.registerStore(hook);
        store2.registerStore(hook);
        expect(consoleSpy).not.toBeCalled();
    })

    it("should trigger a warning if register same hook to store multiple times.", async () => {
        const { StandaloneStore } = await import("houp/store");
        const store = new StandaloneStore();
        function hook() {
            const [count, setCount] = useState(0);
            return [count, setCount];
        }
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        store.registerStore(hook);
        store.registerStore(hook);
        expect(consoleSpy).toBeCalledWith("The store (hook) is already registered. Please file an issue at https://github.com/houpjs/houp/issues if you encounter this warning.");
    })

    it("different keys should be assigned if the registered hook names are the same.", async () => {
        const { StandaloneStore } = await import("houp/store");
        const store = new StandaloneStore();
        let hook1;
        let hook2;
        (function () {
            function hook() {
                const [count, setCount] = useState(0);
                return [count, setCount];
            }
            hook1 = hook;
            store.registerStore(hook);
        })();
        (function () {
            function hook() {
                const [count, setCount] = useState(0);
                return [count, setCount];
            }
            hook2 = hook;
            store.registerStore(hook);
        })();
        expect(store.getHookMeta(hook1)!.key).toBe("hook");
        expect(store.getHookMeta(hook2)!.key).toBe("hook1");
    })
})

describe("registerStore - function without name", () => {
    it("there shouldn't be a warning if the same hook is registered to different store.", async () => {
        const { StandaloneStore } = await import("houp/store");
        const store1 = new StandaloneStore();
        const store2 = new StandaloneStore();
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        const hook = store1.registerStore(() => {
            const [count, setCount] = useState(0);
            return [count, setCount];
        });
        store2.registerStore(hook);
        expect(consoleSpy).not.toBeCalled();
    })

    it("should trigger a warning if register same hook to store multiple times.", async () => {
        const { StandaloneStore } = await import("houp/store");
        const store = new StandaloneStore();
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        const hook = store.registerStore(() => {
            const [count, setCount] = useState(0);
            return [count, setCount];
        });
        store.registerStore(hook);
        expect(consoleSpy).toBeCalledWith("The store () is already registered. Please file an issue at https://github.com/houpjs/houp/issues if you encounter this warning.");
    })

    it("different keys should be assigned if both registered hook names are empty.", async () => {
        const { StandaloneStore } = await import("houp/store");
        const store = new StandaloneStore();
        const hook1 = store.registerStore(() => {
            const [count, setCount] = useState(0);
            return [count, setCount];
        });
        const hook2 = store.registerStore(() => {
            const [count, setCount] = useState(0);
            return [count, setCount];
        });
        expect(store.getHookMeta(hook1)!.key).toBe("anonymous");
        expect(store.getHookMeta(hook2)!.key).toBe("anonymous1");
    })
})