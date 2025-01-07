import { createElement, use, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import { createProvider } from "./provider";
import { Reference } from "./reference";
import { shallowEqual } from "./shallowEqual";
import { __IS_SSR__, scheduleMicrotask } from "./shared";

/**
 * A hook that can be used as a store.
 */
export type StoreHook<S = unknown> = () => S;

/**
 * @internal
 */
export type StoreHookMeta<S = unknown> = {
    hook: StoreHook<S>;
    key: string;
}

interface IExternalStore<S> {
    /**
     * Update the current state in the store and trigger a change immediately.
     * @param state 
     * @returns 
     */
    updateState: (state: S) => void;
    /**
     * Replace the current state in the store and trigger a change later.
     * @param state 
     * @returns 
     */
    replaceState: (state: S) => void;
    readonly isUnmounted: boolean;
    mount: () => void;
    unmount: () => void;
    getServerSnapshot: () => S;
    subscribe: (listener: () => void) => void;
    getSnapshot: () => S;
}

class ExternalStore<S> implements IExternalStore<S> {

    constructor(state: S) {
        this.#state = state;
    }
    #state: S;
    #isUnmounted: boolean = false;
    #isPending: boolean = false;
    #listeners = new Set<(() => void)>();

    #emitChange = () => {
        for (const listener of this.#listeners) {
            listener();
        }
    }

    #getIsPending = () => {
        return this.#isPending;
    }

    #getIsUnmounted = () => {
        return this.#isUnmounted;
    }

    updateState = (data: S) => {
        this.#state = data;
        this.#isPending = false;
        this.#emitChange();
    }

    replaceState = (state: S) => {
        this.#state = state;
        this.#isPending = true;
    }

    get isPending() {
        return this.#getIsPending();
    }

    get isUnmounted() {
        return this.#getIsUnmounted();
    }

    mount = () => {
        this.#isUnmounted = false;
    }

    unmount = () => {
        this.#isUnmounted = true;
    }

    getServerSnapshot = () => {
        return this.#state;
    }

    subscribe = (listener: () => void) => {
        this.#listeners.add(listener);
        return () => {
            this.#listeners.delete(listener);
        };
    }

    getSnapshot = () => {
        return this.#state;
    }

}

type UseStore = {
    <S>(hook: StoreHook<S>): S;
    <S, T>(hook: StoreHook<S>, selector: (state: S) => T): T;
    <S, T>(hook: StoreHook<S>, selector: (state: S) => T, isEqual: ((a: T, b: T) => boolean)): T;
    (hook: StoreHook, selector?: (state: unknown) => unknown, isEqual?: ((a: unknown, b: unknown) => boolean)): unknown;
}

/**
 * @internal
 */
export interface IStandaloneStore {
    useStore: UseStore;
    /**
     * Register a hook as a store.
     * A hook can only be registered once and must be unregistered before it can be registered again.
     * @param hook The hook to be registered as a store.
     * @returns The registered hook itself.
     */
    registerStore<S>(hook: StoreHook<S>): StoreHook<S>;
    /**
     * Unregister a hook from the store.
     * While it's not usually necessary to unregister a hook, if it's used temporarily, 
     * you may need to do so to avoid conflicts, as a hook can only be registered once 
     * and must be unregistered before it can be registered again.
     * @param hook The hook to be unregistered.
     */
    unregisterStore(hook: StoreHook): void;
    /**
     * Reset the state of a hook to its initial value.
     * @param hook The hook to be reset.
     */
    resetStore(hook: StoreHook): void;
    getHookMeta<S>(hook: StoreHook<S>): StoreHookMeta<S> | null;
    getHookStore(): ExternalStore<StoreHookMeta[]>;
    tryCreateStoreImpl(hook: StoreHook, state: unknown): ExternalStore<unknown>;
    attach(): void;
    detach(): void;
    dispose(): void;
}

/**
 * @internal
 */
export class StandaloneStore implements IStandaloneStore {

    #attached: boolean = false;
    #hookReference = new Reference<StoreHook<unknown>>();

    #registeredHooks = new Map<StoreHook, StoreHookMeta>();
    #registeredHooksKeys = new Set<string>();

    #storeImplDepository = new Map<StoreHook, ExternalStore<unknown>>();
    #hookStore = new ExternalStore<StoreHookMeta[]>([]);

    #storeImplListeners: Map<StoreHook, Set<() => void>> = new Map();

    #registerStoreWaitingTasks = new Map<StoreHook, { task: Promise<void>, complete: () => void }>();

    #subscribeStoreImpl = (hook: StoreHook, listener: () => void) => {
        const listeners = this.#storeImplListeners.get(hook) ?? new Set();
        listeners.add(listener);
        if (!this.#storeImplListeners.has(hook)) {
            this.#storeImplListeners.set(hook, listeners);
        }
        return () => {
            listeners.delete(listener);
            if (listeners.size === 0) {
                this.#storeImplListeners.delete(hook);
            }
        };
    }

    #emitStoreImplChange = (hook: StoreHook) => {
        const listeners = this.#storeImplListeners.get(hook);
        if (listeners) {
            for (const listener of listeners) {
                listener();
            }
        }
    }

    #generateHookKey = (hook: StoreHook) => {
        const key = hook.name || "anonymous";
        let i = 1;
        let newKey = key;
        while (this.#registeredHooksKeys.has(newKey)) {
            newKey = key + i.toString();
            i++;
        }
        return newKey;
    }

    #getHooks = (): StoreHookMeta[] => {
        const hooks: StoreHookMeta[] = [];
        for (const [, value] of this.#registeredHooks) {
            hooks.push(value);
        }
        return hooks;
    }

    #getStoreImpl = <S>(hook: StoreHook<S>) => {
        const store = this.#storeImplDepository.get(hook);
        if (!store) {
            throw new Error(`Unable to find the store (${hook.name}). This usually happens if the store has been disposed.`);
        }
        return store as ExternalStore<S>;
    }

    /**
     * Synchronizes the #storeImplDepository.
     * When a store is unmounted, it will be removed from #storeImplDepository.
     */
    #syncStoreImpl = (hook: StoreHook) => {
        const store = this.#storeImplDepository.get(hook);
        if (store &&
            store.isUnmounted) {
            this.#storeImplDepository.delete(hook);
        }
    }

    #useSyncStoreImpl = (hook: StoreHook) => {
        useEffect(() => {
            this.#hookReference.increase(hook);
            return () => {
                this.#hookReference.decrease(hook);
                // Remove the unmounted store in the next tick.
                // The store may be marked as unmounted in the current tick because effects are executed twice in strict mode.
                scheduleMicrotask(() => {
                    if (this.#hookReference.getReference(hook) === 0) {
                        this.#syncStoreImpl(hook);
                    }
                });
            }
        }, [hook])
    }

    #getRegisterStoreWaitingTask = (hook: StoreHook): Promise<void> => {
        let taskItem = this.#registerStoreWaitingTasks.get(hook);
        if (!taskItem) {
            let complete: (() => void) = () => { };
            const task = new Promise<void>((resolve) => {
                complete = () => {
                    resolve();
                }
            });
            const unsubscribe = this.#subscribeStoreImpl(hook, () => {
                unsubscribe();
                complete?.();
            });
            taskItem = {
                task,
                complete,
            };
            this.#registerStoreWaitingTasks.set(hook, taskItem);
        }
        return taskItem.task;
    }

    #waitStore = (hook: StoreHook) => {
        if (!this.#attached) {
            return;
        }
        const store = this.#storeImplDepository.get(hook);
        if (store && !store.isUnmounted) {
            this.#registerStoreWaitingTasks.delete(hook);
            return;
        }
        if (!this.#registeredHooks.has(hook)) {
            this.registerStore(hook);
        }
        use(this.#getRegisterStoreWaitingTask(hook));
    }

    useStore: UseStore = (
        hook: StoreHook,
        selector?: (state: unknown) => unknown,
        isEqual?: ((a: unknown, b: unknown) => boolean),
    ): unknown => {
        if (__IS_SSR__) {
            // __IS_SSR__ is a constant value, so it's safe to call hook here.
            const initialState = hook();
            this.tryCreateStoreImpl(hook, initialState);
        } else {
            this.#waitStore(hook);
        }
        const store = this.#getStoreImpl(hook);
        const state = useSyncExternalStoreWithSelector(
            store.subscribe,
            store.getSnapshot,
            store.getServerSnapshot,
            selector ?? (s => s),
            isEqual ?? shallowEqual,
        );

        this.#useSyncStoreImpl(hook);

        return state;
    }

    registerStore = <S>(hook: StoreHook<S>): StoreHook<S> => {
        if (this.#registeredHooks.has(hook)) {
            console.warn(`The store (${hook.name}) is already registered. Please file an issue at https://github.com/houpjs/houp/issues if you encounter this warning.`);
            return hook;
        }
        const key = this.#generateHookKey(hook);
        this.#registeredHooksKeys.add(key);
        this.#registeredHooks.set(hook, {
            hook,
            key,
        });
        this.#hookStore.updateState(this.#getHooks());
        return hook;
    }

    unregisterStore = (hook: StoreHook) => {
        if (this.#registeredHooks.has(hook)) {
            // Do not remove the key from this.#registeredHooksKeys when unregistering,
            // as it ensures the key remains unique if the hook is registered again,
            // and allows the Provider to refresh its state.
            this.#registeredHooks.delete(hook);
            this.#hookStore.updateState(this.#getHooks());
        }
    }

    resetStore = (hook: StoreHook): void => {
        if (this.#registeredHooks.has(hook)) {
            this.#registeredHooks.delete(hook);
            const store = this.#storeImplDepository.get(hook);
            if (store) {
                store.unmount();
            }
            this.registerStore(hook);
        }
    }

    getHookMeta = <S>(hook: StoreHook<S>): StoreHookMeta<S> | null => {
        if (this.#registeredHooks.has(hook)) {
            return this.#registeredHooks.get(hook) as StoreHookMeta<S>;
        }
        return null;
    }

    getHookStore = () => {
        return this.#hookStore;
    }

    tryCreateStoreImpl = (hook: StoreHook, state: unknown) => {
        let store = this.#storeImplDepository.get(hook);
        if (!store) {
            store = new ExternalStore(state);
            this.#storeImplDepository.set(hook, store);
            this.#emitStoreImplChange(hook);
        } else if (store.isUnmounted) {
            // The state may differ from the current store state after unmounted, so it needs to be replaced.
            store.mount();
            store.replaceState(state);
        }
        return store;
    }

    attach = (): void => {
        this.#attached = true;
    }

    detach = (): void => {
        this.#attached = false;
    }

    dispose = (): void => {
        this.#registeredHooks.clear();
        this.#registeredHooksKeys.clear();
        this.#storeImplDepository.clear();
        this.#hookStore.updateState([]);
        this.detach();
    }
}

/**
 * Create a standalone store.
 * **WARNING**: This is not a public API. do not use it in your code.
 * @returns A store.
 * @internal
 */
export function createStoreInternal(disposable: boolean) {
    const store = new StandaloneStore();
    const Provider = createProvider(store);
    let dispose = () => { };
    if (typeof document !== "undefined") {
        const div = document.createElement("div");
        div.dataset["type"] = "houp-provider-do-not-remove";
        div.style.display = "none";
        div.style.position = "absolute";
        div.style.zIndex = "-999";
        document.body.appendChild(div);
        const root = createRoot(div);
        root.render(createElement(Provider));
        dispose = () => {
            root.unmount();
            div.remove();
            store.detach();
        }
        store.attach();
    }
    return {
        useStore: store.useStore,
        resetStore: store.resetStore,
        DO_NOT_USE_Unregister: store.unregisterStore,
        dispose: () => {
            if (!disposable) {
                throw new Error("The store do not support being disposed.");
            }
            store.dispose();
            dispose();
        },
    };
}
