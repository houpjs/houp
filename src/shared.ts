import type { StoreHook } from "./store";

export type Provider = {
    /**
     * Reset the state of a hook to its initial value.
     * @param hook The hook to be reset.
     */
    resetStore<S>(hook: StoreHook<S>): void;
    /**
     * Reset all store hooks to their initial state.
     */
    resetAllStore(): void;
}

/**
 * @internal
 */
export const scheduleMicrotask =
    typeof queueMicrotask === "function"
        ? queueMicrotask
        : (callback: () => void) => Promise.resolve(null).then(callback);

/**
 * Determines if the current environment is server-side rendering (SSR).
 * 
 * **WARNING**: *Do not change this to a function, this should always be a constant value.*
 * 
 * @internal
 */
export const __IS_SSR__ = (typeof window === "undefined" ||
    typeof document === "undefined" ||
    typeof document.createElement !== "function");