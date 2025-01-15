import { ExternalStore } from "./externalStore";
import { Reference } from "./reference";

/**
 * A hook that can be used as a store.
 */
export type StoreHook<S = unknown> = () => S;

/**
 * @internal
 */
export type StoreHookExecutorMetadata<S = unknown> = {
    hook: StoreHook<S>;
    executorKey: string;
}

class StoreHookExecutor<S = unknown> {
    constructor(hook: StoreHook<S>, executorKey: string) {
        this.#hook = hook;
        this.#executorKey = executorKey;
    }
    #hook: StoreHook<S>;
    #executorKeyIndex = 0;
    #executorKey: string;
    #latestMetadata: StoreHookExecutorMetadata<S> | null = null;

    renewExecutorKey = () => {
        this.#executorKeyIndex += 1;
        this.#executorKey = this.#executorKey + "_" + this.#executorKeyIndex.toString();
    }

    getExecutorMetadata(): StoreHookExecutorMetadata<S> {
        if (this.#latestMetadata?.executorKey !== this.#executorKey) {
            this.#latestMetadata = {
                hook: this.#hook,
                executorKey: this.#executorKey,
            }
        }
        return this.#latestMetadata;
    }
}

/**
 * @internal
 */
export type StoreHookMetadata<S = unknown> = {
    executorStore: ExternalStore<StoreHookExecutorMetadata>;
    executor: StoreHookExecutor<S>;
    containerKey: string;
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
    getHookMeta<S>(hook: StoreHook<S>): StoreHookMetadata<S> | null;
    getHookStore(): ExternalStore<StoreHookMetadata[]>;
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

    #registeredHooks = new Map<StoreHook, StoreHookMetadata>();

    // Do not remove the key from #registeredHooksKeys when hooks change,
    // as it ensures the key remains unique if the hook is removed and added again,
    // and allows the Provider to refresh its state.
    #registeredHooksKeys = new Set<string>();

    #storeImplDepository = new Map<StoreHook, ExternalStore<unknown>>();
    #hookStore = new ExternalStore<StoreHookMetadata[]>([]);

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

    #addHook = (hooks: StoreHook[]): boolean => {
        let added = false;
        const addItem = (item: StoreHook) => {
            if (!this.#registeredHooks.has(item)) {
                const key = this.#generateHookKey(item);
                this.#registeredHooksKeys.add(key);
                const executor = new StoreHookExecutor(item, key);
                const metadata: StoreHookMetadata = {
                    executorStore: new ExternalStore(executor.getExecutorMetadata()),
                    executor: executor,
                    containerKey: key,
                }
                this.#registeredHooks.set(item, metadata);
                added = true;
            }
        }
        for (const item of hooks) {
            addItem(item);
        }
        return added;
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
        const store = this.#storeImplDepository.get(hook);
        if (store) {
            store.unmount();
        }
        const hookMetadata = this.#registeredHooks.get(hook)!;
        hookMetadata.executor.renewExecutorKey();
        hookMetadata.executorStore.updateState(hookMetadata.executor.getExecutorMetadata());
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

    getHookMeta = <S>(hook: StoreHook<S>): StoreHookMetadata<S> | null => {
        if (this.#registeredHooks.has(hook)) {
            return this.#registeredHooks.get(hook) as StoreHookMetadata<S>;
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
