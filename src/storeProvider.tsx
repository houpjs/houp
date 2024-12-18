import { type FunctionComponent, useEffect, useRef, useSyncExternalStore } from "react";
import { Reference } from "./reference";
import { getHookStore, STORE_PROVIDER_TYPE, tryCreateStoreImpl, type StoreHookMeta, GLOBAL_PROVIDER_NAMESPACE } from "./store";

/**
 * Represents a function component that provides all stores with the same namespace.
 */
export type StoreProvider = {
    typeStamp: symbol;
    namespace: symbol;
} & FunctionComponent

type StoreProviderHookProps = {
    meta: StoreHookMeta;
}

function StoreProviderHookContainer(props: StoreProviderHookProps) {
    const state = props.meta.hook();
    const initialedRef = useRef(false);
    const store = tryCreateStoreImpl(props.meta.hook, state);
    if (!initialedRef.current) {
        // the state may not same as current store state after hydration when ssr, so we need to replace it.
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

type StoreProviderProps = {
    namespace: symbol;
    reference: Reference<symbol>;
}

/**
 * The `<StoreProvider />` component that provides all stores with the same namespace.
 * In most cases, you should use `<StoreProvider />` in the root of your application.
 * @param props 
 * @example
 * ```tsx
 * createRoot(document.getElementById("root")!).render(
 *   <>
 *     <StoreProvider />
 *     <App />
 *   </>,
 * )
 * ```
 */
function StoreProviderComponent(props: StoreProviderProps) {
    const store = getHookStore(props.namespace);
    const hooks = useSyncExternalStore(
        store.subscribe,
        store.getSnapshot,
        store.getServerSnapshot,
    );

    useEffect(() => {
        props.reference.increase(props.namespace);
        if (props.reference.getReference(props.namespace) > 1) {
            console.warn(`There are multiple identical Provider mounted. Please ensure that the same Provider can only be mounted once at a time, otherwise it may cause unexpected behavior.`);
        }
        return () => {
            props.reference.decrease(props.namespace);
        }
    }, [props.namespace])

    return (
        <>
            {
                hooks.map((meta) => (
                    <StoreProviderHookContainer key={meta.key} meta={meta} />
                ))
            }
        </>
    );
}

function CreateStoreProvider(namespace: symbol): StoreProvider {
    const namespaceReference = new Reference<symbol>();
    const meta: Pick<StoreProvider, "typeStamp" | "namespace"> = {
        typeStamp: STORE_PROVIDER_TYPE,
        namespace: namespace,
    };
    const provider: FunctionComponent = () => {
        return <StoreProviderComponent
            namespace={meta.namespace}
            reference={namespaceReference} />;
    };
    Object.assign(provider, meta);
    return provider as StoreProvider;
}

/**
 * Create a new {@link StoreProvider} that provides all stores with the same namespace.
 * @example
 * ```tsx
 * const MyProvider = CreateProvider();
 * registerStore(someHook, MyProvider);
 * function Component() {
 *   return (   
 *     <MyProvider />
 *     <OtherComponent />
 *   );
 * }
 * ```
 */
export function CreateProvider() {
    return CreateStoreProvider(Symbol());
}

const DefaultStoreProvider = CreateStoreProvider(GLOBAL_PROVIDER_NAMESPACE);

/**
 * The global {@link StoreProvider} component that provides all stores registered globally.
 * In most cases, you should use Provider in the root of your application.
 * @example
 * ```tsx
 * createRoot(document.getElementById("root")!).render(
 *   <>
 *     <Provider />
 *     <App />
 *   </>,
 * )
 * ```
 */
export function Provider() {
    return <DefaultStoreProvider />;
}