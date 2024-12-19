import { useEffect } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import { Reference } from "./reference";
import { shallowEqual } from "./shallowEqual";
import { getStoreImpl, syncStoreImpl, type StoreHook } from "./store";

const hookReference = new Reference<StoreHook<unknown>>();

function getStoreImplWithWarn<S>(hook: StoreHook<S>) {
    const store = getStoreImpl(hook);
    if (store.isUnmounted) {
        console.warn(`The store (${hook.name}) has been unmounted from its Provider. This usually occurs when the Provider is unmounted, and you should avoid using a store that was registered to that Provider.`);
    }
    return store;
}

function useSyncStoreImpl(hook: StoreHook) {
    useEffect(() => {
        hookReference.increase(hook);
        return () => {
            hookReference.decrease(hook);
            // Remove the unmounted store in the next tick.
            // The store may be marked as unmounted in the current tick because effects are executed twice in strict mode.
            setTimeout(() => {
                if (hookReference.getReference(hook) === 0) {
                    syncStoreImpl(hook);
                }
            }, 0);
        }
    }, [hook])
}

/**
 * `useStore` is a React hook that returns the state of a registered store.
 * @param hook The hook that has been registered as a store.
 * @returns The state returned by the hook.
 */
export function useStore<S>(hook: StoreHook<S>): S;
/**
 * `useStore` is a React hook that returns a selected value from a store's state with a custom selector.
 * @param hook The hook registered as a store.
 * @param selector A function to select a specific value from the store's state, allowing you to control re-renders for better performance.
 * @returns The value returned by the selector.
 */
export function useStore<S, T>(hook: StoreHook<S>, selector: (state: S) => T): T
/**
 * `useStore` is a React hook that returns a selected value from a store's state with a custom selector and equality check.
 * @param hook The hook registered as a store.
 * @param selector A function to select a specific value from the store's state, allowing you to control re-renders for better performance.
 * @param isEqual A function to compare two values and determine equality. If not provided, shallow comparison is used by default.
 * @returns The value returned by the selector.
 */
export function useStore<S, T>(hook: StoreHook<S>, selector: (state: S) => T, isEqual: ((a: T, b: T) => boolean)): T
export function useStore(
    hook: StoreHook,
    selector?: (state: unknown) => unknown,
    isEqual?: ((a: unknown, b: unknown) => boolean),
): unknown {

    const store = getStoreImplWithWarn(hook);
    const state = useSyncExternalStoreWithSelector(
        store.subscribe,
        store.getSnapshot,
        store.getServerSnapshot,
        selector ?? (s => s),
        isEqual ?? shallowEqual,
    );

    useSyncStoreImpl(hook);

    return state;
}