import { useEffect, use } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import { ExternalStore } from "./externalStore";
import { Reference } from "./reference";
import { shallowEqual } from "./shallowEqual";
import { __IS_SSR__, scheduleMicrotask } from "./shared";
import { Signal } from "./signal";

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

type UseStore = {
    <S>(hook: StoreHook<S>): S;
    <S, T>(hook: StoreHook<S>, selector: (state: S) => T): T;
    <S, T>(hook: StoreHook<S>, selector: (state: S) => T, isEqual: ((current: T, next: T) => boolean)): T;
    (hook: StoreHook, selector?: (state: unknown) => unknown, isEqual?: ((current: unknown, next: unknown) => boolean)): unknown;
}

type RegisterStore = {
    <S>(hook: StoreHook<S>): StoreHook<S>;
    (hook: StoreHook[]): void;
    (hook: StoreHook | StoreHook[]): unknown | void
}

/**
 * @internal
 */
export interface IStandaloneStore {
    useStore: UseStore;
    registerStore: RegisterStore;
    /**
     * Unregister a hook from the store.
     * @param hook The hook to be unregistered.
     */
    unregisterStore<S>(hook: StoreHook<S>): void;
    /**
     * Reset the state of a hook to its initial value.
     * @param hook The hook to be reset.
     */
    resetStore<S>(hook: StoreHook<S>): void;
    /**
     * Reset all store hooks to their initial state.
     */
    resetAllStore(): void;
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
export type StandaloneStoreMeta = {
    store: IStandaloneStore;
    key: string;
}

/**
 * @internal
 */
export class StandaloneStore implements IStandaloneStore {

    #disposed: boolean = false;
    #attached: boolean = false;
    #hookReference = new Reference<StoreHook<unknown>>();

    #registeredHooks = new Map<StoreHook, StoreHookMeta>();
    #registeredHooksKeys = new Set<string>();

    #storeImplDepository = new Map<StoreHook, ExternalStore<unknown>>();
    #hookStore = new ExternalStore<StoreHookMeta[]>([]);

    #storeImplSignal = new Signal<StoreHook>();

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

    #addHook = (hook: StoreHook | StoreHook[]): boolean => {
        let added = false;
        const addItem = (item: StoreHook) => {
            if (!this.#registeredHooks.has(item)) {
                const key = this.#generateHookKey(item);
                this.#registeredHooksKeys.add(key);
                this.#registeredHooks.set(item, {
                    hook: item,
                    key,
                });
                added = true;
            }
        }
        if (Array.isArray(hook)) {
            for (const item of hook) {
                addItem(item);
            }
        } else {
            addItem(hook);
        }
        return added;
    }

    #removeHook = (hook: StoreHook): boolean => {
        // Do not remove the key from this.#registeredHooksKeys when unregistering,
        // as it ensures the key remains unique if the hook is registered again,
        // and allows the Provider to refresh its state.
        return this.#registeredHooks.delete(hook);
    }

    #emitHooksChange = () => {
        const hooks = Array.from(this.#registeredHooks.values());
        this.#hookStore.updateState(hooks);
    }

    #getStoreImpl = <S>(hook: StoreHook<S>) => {
        const store = this.#storeImplDepository.get(hook);
        if (!store) {
            if (!this.#disposed && !this.#registeredHooks.has(hook)) {
                throw new Error(`The store (${hook.name}) has not been registered yet. Did you forget to call registerStore to register it?`);
            }
            throw new Error(`Unable to find the store (${hook.name}). This usually happens if the store has been disposed.`);
        }
        if (store.isUnmounted) {
            console.warn(`The store (${hook.name}) has been unmounted. Please file an issue at https://github.com/houpjs/houp/issues if you encounter this warning.`);
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
                        this.#hookReference.remove(hook);
                        this.#syncStoreImpl(hook);
                    }
                });
            }
        }, [hook])
    }

    #waitStore = (hook: StoreHook) => {
        if (!this.#attached) {
            return;
        }
        const store = this.#storeImplDepository.get(hook);
        if (store && !store.isUnmounted) {
            this.#storeImplSignal.remove(hook);
            return;
        }
        if (!this.#registeredHooks.has(hook)) {
            return;
        }
        use(this.#storeImplSignal.wait(hook));
    }

    useStore: UseStore = (
        hook: StoreHook,
        selector?: (state: unknown) => unknown,
        isEqual?: ((current: unknown, next: unknown) => boolean),
    ): unknown => {
        if (__IS_SSR__) {
            // __IS_SSR__ is a constant value, so it's safe to call hook here.
            const initialState = hook();
            this.tryCreateStoreImpl(hook, initialState);
        }
        else {
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

    registerStore: RegisterStore = (hook: StoreHook | StoreHook[]): StoreHook => {
        if (this.#addHook(hook)) {
            this.#emitHooksChange();
        }
        if (!Array.isArray(hook)) {
            return hook;
        }
        return void 0 as unknown as StoreHook;
    }

    unregisterStore = <S>(hook: StoreHook<S>) => {
        if (this.#removeHook(hook)) {
            this.#emitHooksChange();
        }
    }

    resetStore = <S>(hook: StoreHook<S>): void => {
        this.#removeHook(hook);
        const store = this.#storeImplDepository.get(hook);
        if (store) {
            store.unmount();
        }
        this.registerStore(hook);
    }

    resetAllStore = () => {
        const hooks = Array.from(this.#registeredHooks.keys());
        this.#registeredHooks.clear();
        for (const hook of hooks) {
            this.#addHook(hook);
        }
        for (const [, store] of this.#storeImplDepository) {
            store.unmount();
        }
        this.#emitHooksChange();
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
            this.#storeImplSignal.dispatch(hook);
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
        this.#hookReference.clear();
        this.detach();
        this.#disposed = true;
    }
}
