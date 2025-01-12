import { type PropsWithChildren, useEffect, useRef } from "react";
import { StoreProvider } from "../provider/storeProvider";
import { Reference } from "../reference";
import { scheduleMicrotask } from "../shared";
import { type IStandaloneStore, StandaloneStore, StoreHook } from "../store";
import { type ScopedStore, ScopedStoreContext, type ScopedStoreProvider } from "./scopedStoreContext";

const storeReference = new Reference<IStandaloneStore>();

/**
 * `createScopedStore` creates a `ScopedStoreProvider` component that provides a scoped store to its child components.
 * The store will be disposed of when the component is unmounted.
 * @param hooks A hook or an array of hooks that will be used as the store in the scoped store.
 * @returns A `ScopedStoreProvider` component that provides a scoped store to its child components.
 * @example
 * ```tsx
 * function useCounter() {
 *     const [count, setCount] = useState(0);
 *     return { count, setCount };
 * }
 * 
 * const ScopedStore = createScopedStore(useCounter);
 * 
 * function Counter() {
 *     const scopedStore = useScopedStore();
 *     const store = scopedStore.useStore(useCounter);
 *     return (
 *         <div>{store.count}</div>
 *     );
 * }
 * 
 * function Component() {
 *     return (
 *         <ScopedStore>
 *             <Counter />
 *         </ScopedStore>
 *     );
 * }
 * ```
 */
export function createScopedStore(hooks: StoreHook | StoreHook[]): ScopedStoreProvider {
    const ScopedStore = (props: PropsWithChildren) => {
        const storeRef = useRef<ScopedStore>(null);
        const standaloneStoreRef = useRef<StandaloneStore>(null);
        if (!standaloneStoreRef.current) {
            const standaloneStore = new StandaloneStore();
            standaloneStore.registerStore(hooks);
            standaloneStoreRef.current = standaloneStore;
        }
        if (!storeRef.current) {
            const standaloneStore = standaloneStoreRef.current;
            const store = {
                useStore: standaloneStore.useStore,
                resetStore: standaloneStore.resetStore,
                resetAllStore: standaloneStore.resetAllStore,
            };
            storeRef.current = store;
        }

        useEffect(() => {
            const standaloneStore = standaloneStoreRef.current!;
            storeReference.increase(standaloneStore);
            return () => {
                storeReference.decrease(standaloneStore);
                // try dispose store in the next tick.
                // The store reference may be 0 in the current tick because effects are executed twice in strict mode.
                scheduleMicrotask(() => {
                    if (storeReference.getReference(standaloneStore) === 0) {
                        storeReference.remove(standaloneStore);
                        standaloneStore.dispose();
                    }
                });
            }
        }, []);

        return (
            <ScopedStoreContext.Provider value={storeRef.current}>
                <StoreProvider store={standaloneStoreRef.current} />
                {props.children}
            </ScopedStoreContext.Provider>
        );
    }
    return ScopedStore;
}
