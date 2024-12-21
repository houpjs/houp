import { useEffect, useRef, useSyncExternalStore } from "react";
import { Reference } from "./reference";
import { type StoreHookMeta, getHookStore, GLOBAL_PROVIDER_NAMESPACE, tryCreateStoreImpl } from "./store";

const namespaceReference = new Reference<string | symbol>();

function getNamespace(namespace?: string) {
    if (!namespace) {
        return GLOBAL_PROVIDER_NAMESPACE;
    }
    return namespace;
}

type ProviderHookContainerProps = {
    meta: StoreHookMeta;
}

function ProviderHookContainer(props: ProviderHookContainerProps) {
    const state = props.meta.hook();
    const initialedRef = useRef(false);
    const store = tryCreateStoreImpl(props.meta.hook, state);
    if (!initialedRef.current) {
        // The state may differ from the current store state after hydration in SSR, so it needs to be replaced.
        if (!Object.is(store.getSnapshot(), state)) {
            store.replaceState(state);
        }
    }

    useEffect(() => {
        store.mount();
        return () => {
            store.unmount();
        }
    }, [store])

    useEffect(() => {
        if (initialedRef.current) {
            store.updateState(state);
        } else {
            initialedRef.current = true;
        }
    })

    return null;
}

export type ProviderProps = {
    /**
     * The namespace of the provider.
     */
    namespace?: string;
}

/**
 * The `<Provider />` component that provides access to all stores registered under the same namespace.
 * It is recommended to use it at the root of your application.
 * @param props The props of the `<Provider />` component. You can add the namespace prop to the `<Provider />` to make it a namespaced provider.
 * @example
 * ```tsx
 * createRoot(document.getElementById("root")!).render(
 *   <StrictMode>
 *     <Provider />
 *     <App />
 *   </StrictMode>,
 * )
 * ```
 */
export function Provider(props: ProviderProps) {
    const namespace = getNamespace(props.namespace);
    const store = getHookStore(namespace);
    const hooks = useSyncExternalStore(
        store.subscribe,
        store.getSnapshot,
        store.getServerSnapshot,
    );

    useEffect(() => {
        namespaceReference.increase(namespace);
        if (namespaceReference.getReference(namespace) > 1) {
            console.warn(`Multiple identical Providers are mounted. Please ensure that each Provider is only mounted once to avoid potential unexpected behavior.`);
        }
        return () => {
            namespaceReference.decrease(namespace);
        }
    }, [namespace])

    return (
        <>
            {
                hooks.map((meta) => (
                    <ProviderHookContainer key={meta.key} meta={meta} />
                ))
            }
        </>
    );
}
