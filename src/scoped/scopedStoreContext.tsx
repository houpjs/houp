import { createContext, type FC, type PropsWithChildren } from "react";
import type { Store } from "../shared";

export type ScopedStore = Omit<Store, "dispose" | "registerStore">;

export type ScopedStoreProvider = FC<PropsWithChildren>;

/**
 * @internal
 */
export const ScopedStoreContext = createContext<ScopedStore>(null as unknown as ScopedStore);