import { useEffect, useSyncExternalStore } from "react";
import { Reference } from "../reference";
import type { IStandaloneStore } from "../store";
import { HookContainer } from "./hookContainer";

const providerReference = new Reference<IStandaloneStore>();

type StoreProviderProps = {
    store: IStandaloneStore;
}

/**
 * @internal
 * @param props 
 * @returns 
 */
export function StoreProvider(props: StoreProviderProps) {
    props.store.attach();
    const store = props.store.getHookStore();
    const hooks = useSyncExternalStore(
        store.subscribe,
        store.getSnapshot,
        store.getServerSnapshot,
    );

    useEffect(() => {
        props.store.attach();
        providerReference.increase(props.store);
        if (providerReference.getReference(props.store) > 1) {
            console.warn("Multiple identical Providers are mounted. Please file an issue at https://github.com/houpjs/houp/issues if you encounter this warning.");
        }
        return () => {
            props.store.detach();
            providerReference.decrease(props.store);
        }
    }, [props.store])

    return (
        <>
            {
                hooks.map((meta) => (
                    <HookContainer
                        key={meta.key}
                        store={props.store}
                        meta={meta} />
                ))
            }
        </>
    );
}
