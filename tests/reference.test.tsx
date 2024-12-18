import { renderHook } from "@testing-library/react";
import { Reference } from "houp/reference";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
})

describe("reference", () => {
    it("normal", async () => {
        const hookReference = new Reference<unknown>();
        const hook = () => { };
        expect(hookReference.getReference(hook)).toBe(0);
        for (let i = 0; i < 10; i++) {
            hookReference.increase(hook);
        }
        for (let i = 0; i < 10; i++) {
            hookReference.decrease(hook);
        }
        expect(hookReference.getReference(hook)).toBe(0);
    })

    it("normal - revert", async () => {
        const hookReference = new Reference<unknown>();
        const hook = () => { };
        expect(hookReference.getReference(hook)).toBe(0);
        for (let i = 0; i < 10; i++) {
            hookReference.decrease(hook);
        }
        for (let i = 0; i < 10; i++) {
            hookReference.increase(hook);
        }
        expect(hookReference.getReference(hook)).toBe(0);
    })

    it("work in hook", async () => {
        const hookReference = new Reference<unknown>();
        const hook = () => { };
        expect(hookReference.getReference(hook)).toBe(0);
        const useHook = () => {
            useEffect(() => {
                hookReference.increase(hook);
                return () => {
                    hookReference.decrease(hook);
                };
            }, [])
        };
        const result = renderHook(useHook);
        expect(hookReference.getReference(hook)).toBe(1);
        result.unmount();
        expect(hookReference.getReference(hook)).toBe(0);
    })

    it("work in hook - revert", async () => {
        const hookReference = new Reference<unknown>();
        const hook = () => { };
        expect(hookReference.getReference(hook)).toBe(0);
        const useHook = () => {
            useEffect(() => {
                hookReference.decrease(hook);
                return () => {
                    hookReference.increase(hook);
                };
            }, [])
        };
        const result = renderHook(useHook);
        expect(hookReference.getReference(hook)).toBe(-1);
        result.unmount();
        expect(hookReference.getReference(hook)).toBe(0);
    })
})