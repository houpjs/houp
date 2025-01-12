import { createStoreInternal } from "./createStore";
import type { Store } from "./shared";
import type { StoreHook } from "./store";

export { type Store } from "./shared";
export { type StoreHook } from "./store";
export type { ScopedStore, ScopedStoreProvider } from "./scoped/scopedStoreContext";
export * from "./scoped/scopedStore";
export * from "./scoped/useScopedStore";

const defaultStore = createStoreInternal(false);

/**
 * Create a standalone store.
 * @returns A store.
 */
export function createStore(): Store {
    const store = createStoreInternal(true);
    return {
        registerStore: store.registerStore,
        useStore: store.useStore,
        resetStore: store.resetStore,
        resetAllStore: store.resetAllStore,
        dispose: store.dispose,
    };
}

/**
 * Register a hook as a store.
 * @param hook The hook to be registered as a store.
 * @returns The registered hook itself.
 */
export function registerStore<S>(hook: StoreHook<S>): StoreHook<S>;
/**
 * Register an array of hooks at once.
 * @param hooks The array of hooks to be registered as stores.
 */
export function registerStore(hooks: StoreHook[]): void;
export function registerStore(hook: StoreHook | StoreHook[]): unknown | void {
    return defaultStore.registerStore(hook);
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
export function useStore<S, T>(hook: StoreHook<S>, selector: (state: S) => T, isEqual: ((current: T, next: T) => boolean)): T;
export function useStore(
    hook: StoreHook,
    selector?: (state: unknown) => unknown,
    isEqual?: ((current: unknown, next: unknown) => boolean),
): unknown {
    return defaultStore.useStore(hook, selector, isEqual);
}

/**
 * Reset the state of a hook to its initial value.
 * @param hook The hook to be reset.
 */
export function resetStore<S>(hook: StoreHook<S>): void {
    defaultStore.resetStore(hook);
}

/**
 * Reset all store hooks to their initial state.
 */
export function resetAllStore(): void {
    defaultStore.resetAllStore();
}