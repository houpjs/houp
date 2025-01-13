import { ExternalStore } from "./externalStore";
import { Reference } from "./reference";

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

/**
 * @internal
 */
export interface IStandaloneStore {
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
    getStoreImpl<S>(hook: StoreHook<S>): ExternalStore<S>;
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
    constructor(hooks: StoreHook[]) {
        this.#addHook(hooks);
        this.#updateHookStore();
    }

    #hookReference = new Reference<StoreHook<unknown>>();

    #registeredHooks = new Map<StoreHook, StoreHookMeta>();
    #registeredHooksKeys = new Set<string>();

    #storeImplDepository = new Map<StoreHook, ExternalStore<unknown>>();
    #hookStore = new ExternalStore<StoreHookMeta[]>([]);

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

    #updateHookStore = () => {
        const hooks = Array.from(this.#registeredHooks.values());
        this.#hookStore.updateState(hooks);
    }

    getStoreImpl = <S>(hook: StoreHook<S>) => {
        const store = this.#storeImplDepository.get(hook);
        if (!store) {
            throw new Error(`Unable to find the store (${hook.name}). Please file an issue at https://github.com/houpjs/houp/issues if you encounter this error.`);
        }
        return store as ExternalStore<S>;
    }

    resetStore = <S>(hook: StoreHook<S>): void => {
        if (!this.#registeredHooks.has(hook)) {
            console.warn(`Cannot reset the store (${hook.name}) because it does not exist in the StoreProvider.`);
            return;
        }
        this.#removeHook(hook);
        const store = this.#storeImplDepository.get(hook);
        if (store) {
            store.unmount();
        }
        if (this.#addHook(hook)) {
            this.#updateHookStore();
        }
    }

    resetAllStore = () => {
        const hooks = Array.from(this.#registeredHooks.keys());
        this.#registeredHooks.clear();
        this.#addHook(hooks);
        for (const [, store] of this.#storeImplDepository) {
            store.unmount();
        }
        this.#updateHookStore();
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
        } else if (store.isUnmounted) {
            // The state may differ from the current store state after unmounted, so it needs to be replaced.
            store.mount();
            store.replaceState(state);
        }
        return store;
    }

    dispose = (): void => {
        this.#registeredHooks.clear();
        this.#registeredHooksKeys.clear();
        this.#storeImplDepository.clear();
        this.#hookStore.updateState([]);
        this.#hookReference.clear();
    }
}
