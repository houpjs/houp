import { type FC, useEffect, useRef, useSyncExternalStore } from "react";
import { Reference } from "./reference";
import type { IStandaloneStore, StoreHookMeta } from "./store";

const providerReference = new Reference<IStandaloneStore>();

type HookContainerProps = {
    /**
     * The store of the provider.
     */
    store: IStandaloneStore;
    meta: StoreHookMeta;
}

function HookContainer(props: HookContainerProps) {
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

type ProviderProps = {
    /**
     * The store of the provider.
     */
    store: IStandaloneStore;
}

function ProviderHost(props: ProviderProps) {
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
            console.warn(`Multiple identical Providers are mounted. Please file an issue at https://github.com/houpjs/houp/issues if you encounter this warning.`);
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

/**
 * **WARNING**: This is not a public API. do not use it in your code.
 * @internal
 * @param store 
 * @returns 
 */
export function createProvider(store: IStandaloneStore) {
    const Provider: FC = () => {
        return (
            <>
                <ProviderHost store={store} />
            </>
        );
    }
    return Provider;
}
