import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
})

describe("registerStore - function with name", () => {
    it("there shouldn't be a warning if the store is registered to the same provider multiple times.", async () => {
        const { registerStore } = await import("houp");
        function hook() {
            const [count, setCount] = useState(0);
            return [count, setCount];
        }
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        registerStore(hook);
        registerStore(hook);
        expect(consoleSpy).not.toBeCalled();
    })

    it("should trigger a warning if register same hook to different provider.", async () => {
        const { registerStore, CreateProvider } = await import("houp");
        const myProvider = CreateProvider();
        function hook() {
            const [count, setCount] = useState(0);
            return [count, setCount];
        }
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        registerStore(hook);
        registerStore(hook, myProvider);
        expect(consoleSpy).toBeCalledWith("The store (hook) has already been registered. This usually happens when you register the same hook with different providers simultaneously.");
    })

    it("different keys should be assigned if the registered hook names are the same.", async () => {
        const { registerStore } = await import("houp");
        const { getHookMeta } = await import("houp/store");
        let hook1;
        let hook2;
        (function () {
            function hook() {
                const [count, setCount] = useState(0);
                return [count, setCount];
            }
            hook1 = hook;
            registerStore(hook);
        })();
        (function () {
            function hook() {
                const [count, setCount] = useState(0);
                return [count, setCount];
            }
            hook2 = hook;
            registerStore(hook);
        })();
        expect(getHookMeta(hook1)!.key).toBe("hook");
        expect(getHookMeta(hook2)!.key).toBe("hook1");
    })
})

describe("registerStore - function without name", () => {
    it("there shouldn't be a warning if the store is registered to the same provider multiple times.", async () => {
        const { registerStore } = await import("houp");
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        const hook = registerStore(() => {
            const [count, setCount] = useState(0);
            return [count, setCount];
        });
        registerStore(hook);
        expect(consoleSpy).not.toBeCalled();
    })

    it("should trigger a warning if register same hook to different provider.", async () => {
        const { registerStore, CreateProvider } = await import("houp");
        const myProvider = CreateProvider();
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        const hook = registerStore(() => {
            const [count, setCount] = useState(0);
            return [count, setCount];
        });
        registerStore(hook, myProvider);
        expect(consoleSpy).toBeCalledWith("The store () has already been registered. This usually happens when you register the same hook with different providers simultaneously.");
    })

    it("different keys should be assigned if both registered hook names are empty.", async () => {
        const { registerStore } = await import("houp");
        const { getHookMeta } = await import("houp/store");
        const hook1 = registerStore(() => {
            const [count, setCount] = useState(0);
            return [count, setCount];
        });
        const hook2 = registerStore(() => {
            const [count, setCount] = useState(0);
            return [count, setCount];
        });
        expect(getHookMeta(hook1)!.key).toBe("anonymous");
        expect(getHookMeta(hook2)!.key).toBe("anonymous1");
    })
})