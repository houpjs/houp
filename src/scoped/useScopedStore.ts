import { use } from "react";
import { type ScopedStore, ScopedStoreContext } from "./scopedStoreContext";

/**
 * `useScopedStore` is a React hook that returns a `ScopedStore` from a `ScopedStoreProvider` component.
 * @returns 
 */
export function useScopedStore(): ScopedStore {
    const store = use(ScopedStoreContext);
    if (!store) {
        throw new Error("useScopedStore can only be used within a ScopedStore component.");
    }
    return store;
}