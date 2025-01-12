import { useSyncExternalStore } from "react";
import type { IExternalStore } from "../externalStore";
import type { StandaloneStoreMeta } from "../store";
import { StoreProvider } from "./storeProvider";

type ProvidersHostProps = {
    store: IExternalStore<StandaloneStoreMeta[]>;
}

/**
 * @internal
 * @param props 
 * @returns 
 */
export function ProvidersHost(props: ProvidersHostProps) {
    const stores = useSyncExternalStore(
        props.store.subscribe,
        props.store.getSnapshot,
        props.store.getServerSnapshot,
    );

    return (
        <>
            {
                stores.map((store) => (
                    <StoreProvider
                        key={store.key}
                        store={store.store} />
                ))
            }
        </>
    );
}

