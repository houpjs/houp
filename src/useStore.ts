import { useEffect, useSyncExternalStore } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import { Reference } from "./reference";
import { shallowEqual } from "./shallowEqual";
import { getStoreImpl, syncStoreImpl, type StoreHook } from "./store";

const hookReference = new Reference<StoreHook<unknown>>();

function getStoreImplWithWarn<S>(hook: StoreHook<S>) {
    const store = getStoreImpl(hook);
    if (store.isUnmounted) {
        console.warn(`The store(${hook.name}) has been unmounted from a Provider. This usually happens when a Provider has been unmounted, and you should not use a store registered to that Provider.`);
    }
    return store;
}

function useSyncStoreImpl(hook: StoreHook) {
    useEffect(() => {
        hookReference.increase(hook);
        return () => {
            hookReference.decrease(hook);
            // remove unmounted store in next tick.
            // store may be marked as unmounted in current tick, because effect will be executed twice in strict mode.
            setTimeout(() => {
                if (hookReference.getReference(hook) === 0) {
                    syncStoreImpl(hook);
                }
            }, 0);
        }
    }, [hook])
}

/**
 * `useStore` is a react hook that returns the state of a store.
 * @param hook The hook that has been registered as a store.
 * @returns The return value of the hook.
 */
export function useStore<S>(hook: StoreHook<S>): S {

    const store = getStoreImplWithWarn(hook);
    const state = useSyncExternalStore(
        store.subscribe,
        store.getSnapshot,
        store.getServerSnapshot,
    );

    useSyncStoreImpl(hook);

    return state;
}

/**
 * `useStoreWithSelector` is a react hook that returns a value selected from the state of a store.
 * Unlike `useStore`, it provides custom selector and equality check, allowing control over when component re-render, improving performance.
 * @param hook The hook that has been registered as a store.
 * @param selector A function that takes the state of the store.
 * @param isEqual A function that comparison between two values to determine if they are equal. If not specified, will use a shallow comparison.
 * @returns The return value of the selector.
 */
export function useStoreWithSelector<S, T>(
    hook: StoreHook<S>,
    selector: (state: S) => T,
    isEqual?: ((a: T, b: T) => boolean) | undefined,
): T {

    const store = getStoreImplWithWarn(hook);
    const state = useSyncExternalStoreWithSelector(
        store.subscribe,
        store.getSnapshot,
        store.getServerSnapshot,
        selector,
        isEqual ?? shallowEqual,
    );

    useSyncStoreImpl(hook);

    return state;
}