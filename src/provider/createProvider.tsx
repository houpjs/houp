import { useContext, useEffect, useRef, type FC, type PropsWithChildren } from "react";
import { Reference } from "../reference";
import { scheduleMicrotask } from "../shared";
import { StandaloneStore, type IStandaloneStore, type StoreHook } from "../store";
import { StoreContext, StoreMap } from "./providerContext";
import { StoreProvider } from "./storeProvider";

/**
 * `StoreProvider` is a React component that provides store to its child components.
 */
export type StoreProvider = FC<PropsWithChildren>;

const storeReference = new Reference<IStandaloneStore>();

/**
 * `createProvider` creates a `StoreProvider` component that provides store to its child components.
 * The store will be disposed of when the component is unmounted.
 * @param hooks An array of hooks that will be used as the store.
 * @returns A `StoreProvider` component that provides store to its child components.
 */
export function createProvider(hooks: StoreHook[]): StoreProvider {
    const Provider = (props: PropsWithChildren) => {
        const preStoreMap = useContext(StoreContext);
        const storeMapRef = useRef<StoreMap | null>(null);
        const storeRef = useRef<IStandaloneStore | null>(null);
        if (!storeRef.current) {
            const store = new StandaloneStore(hooks);
            storeRef.current = store;
        }
        if (!storeMapRef.current) {
            storeMapRef.current = new StoreMap(hooks, storeRef.current);
        }
        if (preStoreMap) {
            storeMapRef.current.merge(preStoreMap);
        }

        useEffect(() => {
            const store = storeRef.current!;
            storeReference.increase(store);
            return () => {
                storeReference.decrease(store);
                // try dispose store in the next tick.
                // The store reference may be 0 in the current tick because effects are executed twice in strict mode.
                scheduleMicrotask(() => {
                    if (storeReference.getReference(store) === 0) {
                        storeReference.remove(store);
                        store.dispose();
                    }
                });
            }
        }, []);

        return (
            <StoreContext.Provider value={storeMapRef.current}>
                <StoreProvider store={storeRef.current} />
                {props.children}
            </StoreContext.Provider>
        );
    }
    return Provider;
}