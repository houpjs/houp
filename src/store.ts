
/**
 * @internal
 */
export const GLOBAL_PROVIDER_NAMESPACE = Symbol();
/**
 * A hook that can be used to register a store.
 */
export type StoreHook<S = unknown> = () => S;

/**
 * @internal
 */
export type StoreHookMeta<S = unknown> = {
    hook: StoreHook<S>;
    key: string;
    namespace: string | symbol;
}

interface IStore<S> {
    /**
     * Update the current state in the store and trigger a change.
     * @param state 
     * @returns 
     */
    updateState: (state: S) => void;
    /**
     * Replace the current state in the store without triggering a change.
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

class Store<S> implements IStore<S> {

    constructor(state: S) {
        this.#state = state;
    }
    #state: S;
    #isUnmounted: boolean = false;
    #listeners = new Set<(() => void)>();


    #emitChange = () => {
        for (const listener of this.#listeners) {
            listener();
        }
    }

    #getIsUnmounted = () => {
        return this.#isUnmounted;
    }

    updateState = (data: S) => {
        this.#state = data;
        this.#emitChange();
    }

    replaceState = (state: S) => {
        this.#state = state;
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

const registeredHooks = new Map<StoreHook, StoreHookMeta>();
const registeredHooksKeys = new Set<string>();

const storeImplDepository = new Map<StoreHook, Store<unknown>>();
const hookStore = new Map<string | symbol, Store<StoreHookMeta[]>>();

function generateHookKey(hook: StoreHook) {
    const key = hook.name || "anonymous";
    let i = 1;
    let newKey = key;
    while (registeredHooksKeys.has(newKey)) {
        newKey = key + i.toString();
        i++;
    }
    return newKey;
}

function getHooks(namespace: string | symbol): StoreHookMeta[] {
    const hooks: StoreHookMeta[] = [];
    for (const [, value] of registeredHooks) {
        if (value.namespace === namespace) {
            hooks.push(value);
        }
    }
    return hooks;
}

/**
 * Register a hook as a store in the global namespace.
 * A hook can only be registered once and must be unregistered before it can be registered again.
 * @param hook The hook to be registered as a store.
 * @returns The registered hook itself.
 */
export function registerStore<S>(hook: StoreHook<S>): StoreHook<S>;
/**
 * Register a hook as a store in a specific namespace.
 * A hook can only be registered once and must be unregistered before it can be registered again.
 * @param hook The hook to be registered as a store.
 * @param namespace Specifies the namespace under which the store will be registered. If omitted, the store will be registered in the global namespace.
 * @returns The registered hook itself.
 */
export function registerStore<S>(hook: StoreHook<S>, namespace: string): StoreHook<S>;
export function registerStore<S>(hook: StoreHook<S>, namespace?: string): StoreHook<S> {
    let hiNamespace: string | symbol = GLOBAL_PROVIDER_NAMESPACE;
    if (namespace) {
        hiNamespace = namespace;
    }
    if (registeredHooks.has(hook)) {
        const meta = getHookMeta(hook)!;
        if (meta.namespace !== hiNamespace) {
            console.warn(`The store (${hook.name}) is already registered. This usually occurs when the same hook is registered in different namespaces simultaneously.`);
        }
        return hook;
    }
    const key = generateHookKey(hook);
    registeredHooksKeys.add(key);
    registeredHooks.set(hook, {
        hook,
        key,
        namespace: hiNamespace,
    });
    if (!hookStore.has(hiNamespace)) {
        hookStore.set(hiNamespace, new Store<StoreHookMeta[]>([]));
    }
    const store = hookStore.get(hiNamespace)!;
    store.updateState(getHooks(hiNamespace));
    return hook;
}

/**
 * Unregister a hook from the store.
 * While it's not usually necessary to unregister a hook, if it's used temporarily, 
 * you may need to do so to avoid conflicts, as a hook can only be registered once 
 * and must be unregistered before it can be registered again.
 * @param hook The hook to be unregistered.
 */
export function unregisterStore(hook: StoreHook) {
    if (registeredHooks.has(hook)) {
        const { key, namespace } = registeredHooks.get(hook)!;
        registeredHooksKeys.delete(key);
        registeredHooks.delete(hook);
        hookStore.get(namespace)!.updateState(getHooks(namespace));
    }
}

/**
 * 
 * @internal
 * @param hook
 * @returns 
 */
export function getHookMeta<S>(hook: StoreHook<S>): StoreHookMeta<S> | null {
    if (registeredHooks.has(hook)) {
        return registeredHooks.get(hook) as StoreHookMeta<S>;
    }
    return null;
}

/**
 * @internal
 * @param namespace 
 * @returns 
 */
export function getHookStore(namespace: string | symbol) {
    if (!hookStore.has(namespace)) {
        hookStore.set(namespace, new Store<StoreHookMeta[]>([]));
    }
    return hookStore.get(namespace)!;
}

function addStoreImpl(hook: StoreHook, store: Store<unknown>) {
    storeImplDepository.set(hook, store);
}

/**
 * Synchronizes the storeImplMap.
 * When a store is unmounted, it will be removed from storeImplMap.
 * @internal
 */
export function syncStoreImpl(hook: StoreHook) {
    const store = storeImplDepository.get(hook);
    if (store &&
        store.isUnmounted) {
        storeImplDepository.delete(hook);
    }
}

/**
 * 
 * @internal
 * @param hook 
 * @param state 
 * @param getServerState 
 * @returns 
 */
export function tryCreateStoreImpl(hook: StoreHook, state: unknown) {
    let store = storeImplDepository.get(hook);
    if (!store || store.isUnmounted) {
        store = new Store(state);
        addStoreImpl(hook, store);
    }
    return store;
}

/**
 * @internal
 * @param hook 
 * @returns 
 */
export function getStoreImpl<S>(hook: StoreHook<S>) {
    const store = storeImplDepository.get(hook);
    if (!store) {
        if (registeredHooks.has(hook)) {
            throw new Error(`Unable to find store (${hook.name}). This usually occurs when the Provider is not added to the App or has been unmounted.`);
        }
        throw new Error(`The store (${hook.name}) has not been registered yet. Did you forget to call registerStore to register it?`);
    }
    return store as Store<S>;
}