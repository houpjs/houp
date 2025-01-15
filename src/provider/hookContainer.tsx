import { useSyncExternalStore } from "react";
import type { IStandaloneStore, StoreHookMetadata } from "../store";
import { HookExecutor } from "./hookExecutor";


type HookContainerProps = {
    store: IStandaloneStore;
    metadata: StoreHookMetadata;
}

/**
 * @internal
 * @param props 
 * @returns 
 */
export function HookContainer(props: HookContainerProps) {

    const store = props.metadata.executorStore;
    const executorMetadata = useSyncExternalStore(
        store.subscribe,
        store.getSnapshot,
        store.getServerSnapshot,
    );

    return (
        <HookExecutor
            key={executorMetadata.executorKey}
            hook={executorMetadata.hook}
            store={props.store} />
    );
}