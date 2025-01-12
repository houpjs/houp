import { createRoot } from "react-dom/client";
import { ExternalStore } from "./externalStore";
import { type IStandaloneStore, StandaloneStore, type StandaloneStoreMeta } from "./store";
import { createElement } from "react";
import { ProvidersHost } from "./provider/providersHost";

let houpProviderRoot: HTMLDivElement | null = null;
let standaloneStoreKeyIndex = 0;
const standaloneStoreCache = new Map<IStandaloneStore, StandaloneStoreMeta>();
const standaloneStoreExternalStore = new ExternalStore<StandaloneStoreMeta[]>([]);

function generateStandaloneStoreKey() {
    standaloneStoreKeyIndex++;
    return `houp-standalone-store-${standaloneStoreKeyIndex}`;
}

function emitStoresChange() {
    const stores = Array.from(standaloneStoreCache.values());
    standaloneStoreExternalStore.updateState(stores);
}

function createStandaloneStore() {
    const key = generateStandaloneStoreKey();
    const store = new StandaloneStore();
    standaloneStoreCache.set(store, {
        store,
        key
    });
    emitStoresChange();
    return store;
}

function disposeStandaloneStore(store: IStandaloneStore) {
    if (standaloneStoreCache.has(store)) {
        standaloneStoreCache.delete(store);
        emitStoresChange();
        store.dispose();
    }
}

function createProviderRoot() {
    if (typeof document !== "undefined" && !houpProviderRoot) {

        const div = document.createElement("div");
        div.dataset["type"] = "houp-provider-do-not-remove";
        div.style.display = "none";
        div.style.position = "absolute";
        div.style.zIndex = "-999";
        houpProviderRoot = div;
        document.body.appendChild(div);

        const root = createRoot(div);
        root.render(createElement(ProvidersHost, { store: standaloneStoreExternalStore }));
    }
}

/**
 * Create a standalone store.
 * **WARNING**: This is not a public API. do not use it in your code.
 * @returns A store.
 * @internal
 */
export function createStoreInternal(disposable: boolean) {
    const store = createStandaloneStore();
    createProviderRoot();
    if (houpProviderRoot) {
        store.attach();
    } else {
        store.detach();
    }
    return {
        registerStore: store.registerStore,
        useStore: store.useStore,
        resetStore: store.resetStore,
        resetAllStore: store.resetAllStore,
        dispose: () => {
            if (!disposable) {
                throw new Error("The store do not support being disposed.");
            }
            disposeStandaloneStore(store);
        },
    };
}