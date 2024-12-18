import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
})

describe("registerStore - function with name", () => {
    it("should warn if a hook has been registered", async () => {
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
        expect(consoleSpy).toBeCalledWith("The store(hook) has been registered. You may have called registerStore(hook) multiple times.");
    })

    it("different keys should be assigned when the registered hook names are the same", async () => {
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
    it("should warn if a hook has been registered", async () => {
        const { registerStore } = await import("houp");
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        const hook = registerStore(() => {
            const [count, setCount] = useState(0);
            return [count, setCount];
        });
        registerStore(hook);
        expect(consoleSpy).toBeCalledWith("The store() has been registered. You may have called registerStore() multiple times.");
    })

    it("different keys should be assigned when the registered hook names are both empty", async () => {
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