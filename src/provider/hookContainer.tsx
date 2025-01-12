import { useEffect, useRef } from "react";
import type { IStandaloneStore, StoreHookMeta } from "../store";


type HookContainerProps = {
    store: IStandaloneStore;
    meta: StoreHookMeta;
}

/**
 * @internal
 * @param props 
 * @returns 
 */
export function HookContainer(props: HookContainerProps) {
    const state = props.meta.hook();
    const initialedRef = useRef(false);
    const store = props.store.tryCreateStoreImpl(props.meta.hook, state);

    useEffect(() => {
        store.mount();
        return () => {
            store.unmount();
        }
    }, [store])

    useEffect(() => {
        if (initialedRef.current || store.isPending) {
            store.updateState(state);
        }
        initialedRef.current = true;
    })

    return null;
}