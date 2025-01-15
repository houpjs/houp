import { configure } from "@testing-library/react";
import { useState } from "react";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
    configure({ reactStrictMode: Boolean(process.env.TEST_STRICT_MODE) });
})

describe("new StandaloneStore - function with name", () => {

    it("different keys should be assigned if both the hook names are the same.", async () => {
        const { StandaloneStore } = await import("houp/store");
        let hook1;
        let hook2;
        let hooks = [];
        (function () {
            function hook() {
                const [count, setCount] = useState(0);
                return [count, setCount];
            }
            hook1 = hook;
            hooks.push(hook);
        })();
        (function () {
            function hook() {
                const [count, setCount] = useState(0);
                return [count, setCount];
            }
            hook2 = hook;
            hooks.push(hook);
        })();
        const store = new StandaloneStore(hooks);
        expect(store.getHookMeta(hook1)!.containerKey).toBe("hook");
        expect(store.getHookMeta(hook1)!.executorStore.getSnapshot().executorKey).toBe("hook");
        expect(store.getHookMeta(hook2)!.containerKey).toBe("hook1");
        expect(store.getHookMeta(hook2)!.executorStore.getSnapshot().executorKey).toBe("hook1");
        expect(store.getHookMeta(() => {})).toBe(null);
    })

})

describe("new StandaloneStore - function without name", () => {

    it("different keys should be assigned if both hook names are empty.", async () => {
        const { StandaloneStore } = await import("houp/store");
        const hooks = [
            () => {
                const [count, setCount] = useState(0);
                return [count, setCount];
            },
            () => {
                const [count, setCount] = useState(0);
                return [count, setCount];
            },
        ];
        const store = new StandaloneStore(hooks);
        const [hook1, hook2] = hooks;
        expect(store.getHookMeta(hook1)!.containerKey).toBe("anonymous");
        expect(store.getHookMeta(hook1)!.executorStore.getSnapshot().executorKey).toBe("anonymous");
        expect(store.getHookMeta(hook2)!.containerKey).toBe("anonymous1");
        expect(store.getHookMeta(hook2)!.executorStore.getSnapshot().executorKey).toBe("anonymous1");
    })
})

describe("hook key should be changed after call resetStore", () => {

    it("different keys should be assigned if the registered hook with array.", async () => {
        const { StandaloneStore } = await import("houp/store");
        const hooks = [];
        (function () {
            function hook() {
                const [count, setCount] = useState(0);
                return [count, setCount];
            }
            hooks.push(hook);
        })();
        (function () {
            function hook() {
                const [count, setCount] = useState(0);
                return [count, setCount];
            }
            hooks.push(hook);
        })();
        const [hook1, hook2] = hooks;
        const store = new StandaloneStore(hooks);
        expect(store.getHookMeta(hook1)!.containerKey).toBe("hook");
        expect(store.getHookMeta(hook1)!.executorStore.getSnapshot().executorKey).toBe("hook");
        expect(store.getHookMeta(hook2)!.containerKey).toBe("hook1");
        expect(store.getHookMeta(hook2)!.executorStore.getSnapshot().executorKey).toBe("hook1");
        store.resetStore(hook1);
        expect(store.getHookMeta(hook1)!.containerKey).toBe("hook");
        expect(store.getHookMeta(hook1)!.executorStore.getSnapshot().executorKey).toBe("hook_1");
        expect(store.getHookMeta(hook2)!.containerKey).toBe("hook1");
        expect(store.getHookMeta(hook2)!.executorStore.getSnapshot().executorKey).toBe("hook1");
        store.resetStore(hook2);
        expect(store.getHookMeta(hook1)!.containerKey).toBe("hook");
        expect(store.getHookMeta(hook1)!.executorStore.getSnapshot().executorKey).toBe("hook_1");
        expect(store.getHookMeta(hook2)!.containerKey).toBe("hook1");
        expect(store.getHookMeta(hook2)!.executorStore.getSnapshot().executorKey).toBe("hook1_1");
        store.resetAllStore();
        expect(store.getHookMeta(hook1)!.containerKey).toBe("hook2");
        expect(store.getHookMeta(hook1)!.executorStore.getSnapshot().executorKey).toBe("hook2");
        expect(store.getHookMeta(hook2)!.containerKey).toBe("hook3");
        expect(store.getHookMeta(hook2)!.executorStore.getSnapshot().executorKey).toBe("hook3");
    })
})

describe("StandaloneStore - dispose", () => {

    it("an error should be thrown if call getStoreImpl after the store is disposed.", async () => {
        const { StandaloneStore } = await import("houp/store");
        const hooks = [];
        (function () {
            function hook() {
                const [count, setCount] = useState(0);
                return [count, setCount];
            }
            hooks.push(hook);
        })();
        (function () {
            function hook() {
                const [count, setCount] = useState(0);
                return [count, setCount];
            }
            hooks.push(hook);
        })();
        const [hook1,] = hooks;
        const store = new StandaloneStore(hooks);
        store.dispose();
        try {
            store.getStoreImpl(hook1);
            assert.fail("should throw error");
        } catch (error) {
            expect((error as Error).message).toBe("Unable to find the store (hook). Please file an issue at https://github.com/houpjs/houp/issues if you encounter this error.");
        }
    })
})