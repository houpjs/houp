import type { StoreHook } from "./store";

export type Store = {
    /**
     * Register a hook as a store.
     * @param hook The hook to be registered as a store.
     * @returns The registered hook itself.
     */
    registerStore<S>(hook: StoreHook<S>): StoreHook<S>;
    /**
     * Register an array of hooks at once.
     * @param hooks The array of hooks to be registered as stores.
     */
    registerStore(hooks: StoreHook[]): void;
    /**
    * `useStore` is a React hook that returns the state of a store.
    * @param hook A hook that can be used as a store.
    * @returns The state returned by the hook.
    */
    useStore<S>(hook: StoreHook<S>): S;
    /**
     * `useStore` is a React hook that returns a selected value from a store's state with a custom selector.
     * @param hook A hook that can be used as a store.
     * @param selector A function to select a specific value from the store's state, allowing you to control re-renders for better performance.
     * @returns The value returned by the selector.
     */
    useStore<S, T>(hook: StoreHook<S>, selector: (state: S) => T): T;
    /**
     * `useStore` is a React hook that returns a selected value from a store's state with a custom selector and equality check.
     * @param hook A hook that can be used as a store.
     * @param selector A function to select a specific value from the store's state, allowing you to control re-renders for better performance.
     * @param isEqual A function to compare two values and determine equality. If not provided, shallow comparison is used by default.
     * @returns The value returned by the selector.
     */
    useStore<S, T>(hook: StoreHook<S>, selector: (state: S) => T, isEqual: ((current: T, next: T) => boolean)): T;
    /**
     * Reset the state of a hook to its initial value.
     * @param hook The hook to be reset.
     */
    resetStore<S>(hook: StoreHook<S>): void;
    /**
     * Reset all store hooks to their initial state.
     */
    resetAllStore(): void;
    /**
     * Dispose all hooks in the store.
     * While disposing of the store is usually unnecessary, it may be required if the store is used temporarily.
     * **Note**: Once disposed, the store cannot be used again and will throw an error if accessed.
     */
    dispose(): void;
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