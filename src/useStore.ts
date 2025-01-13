import { useContext, useMemo } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import { StoreContext } from "./provider/providerContext";
import { shallowEqual } from "./shallowEqual";
import { type Provider } from "./shared";
import { type StoreHook } from "./store";

function useStandaloneStore(hook: StoreHook) {
    const storeMap = useContext(StoreContext);
    if (!storeMap) {
        throw new Error(`Unable to find store (${hook.name}). This usually occurs when the StoreProvider is not added to the App.`);
    }
    if (!storeMap.getMap().has(hook)) {
        throw new Error(`Unable to find store (${hook.name}). Did you forget to add it when calling createProvider?`);
    }
    return storeMap.getMap().get(hook)!;
}

/**
 * `useProvider` is a React hook that helps find the nearest `StoreProvider` that contains the specified hook in the component tree and returns a `Provider` object for managing the store within the provider.
 * @param hook A hook that can be used as a store.
 * @returns 
 */
export function useProvider(hook: StoreHook): Provider {
    const standaloneStore = useStandaloneStore(hook);

    return useMemo(() => {
        return {
            resetStore: standaloneStore.resetStore,
            resetAllStore: standaloneStore.resetAllStore,
        };
    }, [standaloneStore])
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
    const standaloneStore = useStandaloneStore(hook);
    const store = standaloneStore.getStoreImpl(hook);

    const state = useSyncExternalStoreWithSelector(
        store.subscribe,
        store.getSnapshot,
        store.getServerSnapshot,
        selector ?? (s => s),
        isEqual ?? shallowEqual,
    );

    return state;
}