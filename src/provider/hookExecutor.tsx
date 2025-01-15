import { useEffect, useRef } from "react";
import type { IStandaloneStore, StoreHook } from "../store";


type HookExecutorProps = {
    store: IStandaloneStore;
    hook: StoreHook;
}

/**
 * @internal
 * @param props 
 * @returns 
 */
export function HookExecutor(props: HookExecutorProps) {
    const state = props.hook();
    const initialedRef = useRef(false);
    const store = props.store.tryCreateStoreImpl(props.hook, state);

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