import { createContext } from "react";
import { StoreHook, type IStandaloneStore } from "../store";

/**
 * @internal
 */
export class StoreMap {
    constructor(hooks: StoreHook[], store: IStandaloneStore) {
        for (const hook of hooks) {
            if (!this.#storeMap.has(hook)) {
                this.#storeMap.set(hook, store);
            }
        }
    }

    #mergedTargetMap: Map<StoreHook, IStandaloneStore> | null = null;
    #storeMap = new Map<StoreHook, IStandaloneStore>();

    merge = (target: StoreMap) => {
        const targetMap = target.#storeMap;
        if (this.#mergedTargetMap !== target.getMap()) {
            this.#mergedTargetMap = targetMap;
            const newMap = new Map<StoreHook, IStandaloneStore>();
            // copy
            for (const [hook, store] of this.#storeMap) {
                newMap.set(hook, store);
            }
            // add if not exist in current
            for (const [hook] of targetMap) {
                if (!this.#storeMap.has(hook)) {
                    newMap.set(hook, targetMap.get(hook)!);
                }
            }
            this.#storeMap = newMap;
        }
    }

    getMap = () => {
        return this.#storeMap;
    }
}

/**
 * @internal
 */
export const StoreContext = createContext<StoreMap | null>(null);