import { configure } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
    configure({ reactStrictMode: Boolean(process.env.TEST_STRICT_MODE) });
})

describe("registerStore - function with name", () => {

    it("different keys should be assigned if the registered hook names are the same. (with single hook)", async () => {
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

    it("different keys should be assigned if the registered hook with array. (with hook array)", async () => {
        const { StandaloneStore } = await import("houp/store");
        const store = new StandaloneStore();
        let hook1;
        let hook2;
        const hooks = [];
        (function () {
            function hook() {
                const [count, setCount] = useState(0);
                return [count, setCount];
            }
            hooks.push(hook);
            hook1 = hook;
        })();
        (function () {
            function hook() {
                const [count, setCount] = useState(0);
                return [count, setCount];
            }
            hook2 = hook;
            hooks.push(hook);
        })();
        store.registerStore(hooks);
        expect(store.getHookMeta(hook1)!.key).toBe("hook");
        expect(store.getHookMeta(hook2)!.key).toBe("hook1");
    })

})

describe("registerStore - function without name", () => {

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

describe("registerStore with hook array", () => {

    it("different keys should be assigned if the registered hook with array.", async () => {
        const { StandaloneStore } = await import("houp/store");
        const store = new StandaloneStore();
        let hook1;
        let hook2;
        const hooks= [];
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
        store.registerStore(hooks);
        expect(store.getHookMeta(hook1)!.key).toBe("hook");
        expect(store.getHookMeta(hook2)!.key).toBe("hook1");
    })
})