import { createStoreInternal, type StoreHook } from "./store";

export { type StoreHook } from "./store";

const globalStore = createStoreInternal(false);

export type Store = {
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
    useStore<S, T>(hook: StoreHook<S>, selector: (state: S) => T, isEqual: ((a: T, b: T) => boolean)): T;
    /**
     * Reset the state of a hook to its initial value.
     * @param hook The hook to be reset.
     */
    resetStore(hook: StoreHook): void;
    /**
     * Dispose all hooks in the store.
     * While it's usually unnecessary to dispose of the store, doing so may be required if it's used temporarily.
     * **Note**: Once disposed, the store cannot be used again and will throw an error if accessed.
     */
    dispose(): void;
}

/**
 * Create a standalone store.
 * @returns A store.
 */
export function createStore(): Store {
    const store = createStoreInternal(true);
    return {
        useStore: store.useStore,
        resetStore: store.resetStore,
        dispose: store.dispose,
    };
}

/**
* `useStore` is a React hook that returns the state of a store.
* @param hook A hook that can be used as a store.
* @returns The state returned by the hook.
*/
export function useStore<S>(hook: StoreHook<S>): S;
/**
 * `useStore` is a React hook that returns a selected value from a store's state with a custom selector.
 * @param hook A hook that can be used as a store.
 * @param selector A function to select a specific value from the store's state, allowing you to control re-renders for better performance.
 * @returns The value returned by the selector.
 */
export function useStore<S, T>(hook: StoreHook<S>, selector: (state: S) => T): T;
/**
 * `useStore` is a React hook that returns a selected value from a store's state with a custom selector and equality check.
 * @param hook A hook that can be used as a store.
 * @param selector A function to select a specific value from the store's state, allowing you to control re-renders for better performance.
 * @param isEqual A function to compare two values and determine equality. If not provided, shallow comparison is used by default.
 * @returns The value returned by the selector.
 */
export function useStore<S, T>(hook: StoreHook<S>, selector: (state: S) => T, isEqual: ((a: T, b: T) => boolean)): T;
export function useStore(
    hook: StoreHook,
    selector?: (state: unknown) => unknown,
    isEqual?: ((a: unknown, b: unknown) => boolean),
): unknown {
    return globalStore.useStore(hook, selector, isEqual);
}

/**
 * Reset the state of a hook to its initial value.
 * @param hook The hook to be reset.
 */
export function resetStore(hook: StoreHook): void {
    globalStore.resetStore(hook);
}