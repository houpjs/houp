import { configure, render } from "@testing-library/react";
import { act, useState } from "react";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
    configure({ reactStrictMode: Boolean(process.env.TEST_STRICT_MODE) });
})

describe("createStore", () => {
    it("an error should be thrown after store has been disposed (before register hook)", async () => {
        const { createStore } = await act(async () => await import("houp"));
        const store = await act(async () => createStore());
        const hook = () => {
            return useState(1);
        };
        await act(async () => store.registerStore(hook));
        const Component = () => {
            const [count] = store.useStore(hook);

            return (
                <>
                    <div>count:{count}</div>
                </>
            );
        }
        await act(async () => store.dispose());
        try {
            await act(async () => render(<Component />));
            assert.fail("should throw error");
        } catch (error) {
            expect((error as Error).message).toBe("Unable to find the store (hook). This usually happens if the store has been disposed.");
        }
    })

    it("an error should be thrown after store has been disposed (after register hook)", async () => {
        // TODO error: An update to Root inside a test was not wrapped in act(...).
        // const { createStore } = await act(async () => await import("houp"));
        // const store = await act(async () => createStore());
        const { createStoreInternal } = await import("houp/createStore");
        const store = await act(async () => createStoreInternal(true));
        const hook = () => {
            return useState(1);
        };
        await act(async () => store.registerStore(hook));
        const Component = () => {
            const [count] = store.useStore(hook);

            return (
                <>
                    <div>count:{count}</div>
                </>
            );
        }
        const { rerender } = await act(async () => render(<Component />));
        await act(async () => store.dispose());
        try {
            await act(async () => rerender(<Component />));
            assert.fail("should throw error");
        } catch (error) {
            expect((error as Error).message).toBe("Unable to find the store (hook). This usually happens if the store has been disposed.");
        }
    })

    it("should throw error if try to dispose a store that not allowed to be disposed", async () => {
        const { createStoreInternal } = await import("houp/createStore");
        const store = await act(async () => createStoreInternal(false));
        try {
            await act(async () => store.dispose());
            assert.fail("should throw error");
        } catch (error) {
            expect((error as Error).message).toBe("The store do not support being disposed.");
        }
    })

    it("call dispose in ssr is fine", async () => {
        const oldDocument = document;
        document = undefined as any;
        const { createStoreInternal } = await import("houp/createStore");
        const store = await act(async () => createStoreInternal(true));

        await act(async () => store.dispose());

        document = oldDocument;
    });
})