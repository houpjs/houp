
/**
 * @internal
 */
export interface IExternalStore<S> {
    /**
     * Update the current state in the store and trigger a change immediately.
     * @param state 
     * @returns 
     */
    updateState: (state: S) => void;
    /**
     * Replace the current state in the store and trigger a change later.
     * @param state 
     * @returns 
     */
    replaceState: (state: S) => void;
    readonly isUnmounted: boolean;
    mount: () => void;
    unmount: () => void;
    getServerSnapshot: () => S;
    subscribe: (listener: () => void) => (() => void);
    getSnapshot: () => S;
}

/**
 * @internal
 */
export class ExternalStore<S> implements IExternalStore<S> {

    constructor(state: S) {
        this.#state = state;
    }
    #state: S;
    #isUnmounted: boolean = false;
    #isPending: boolean = false;
    #listeners = new Set<(() => void)>();

    #emitChange = () => {
        for (const listener of this.#listeners) {
            listener();
        }
    }

    #getIsPending = () => {
        return this.#isPending;
    }

    #getIsUnmounted = () => {
        return this.#isUnmounted;
    }

    updateState = (data: S) => {
        this.#state = data;
        this.#isPending = false;
        this.#emitChange();
    }

    replaceState = (state: S) => {
        this.#state = state;
        this.#isPending = true;
    }

    get isPending() {
        return this.#getIsPending();
    }

    get isUnmounted() {
        return this.#getIsUnmounted();
    }

    mount = () => {
        this.#isUnmounted = false;
    }

    unmount = () => {
        this.#isUnmounted = true;
    }

    getServerSnapshot = () => {
        return this.#state;
    }

    subscribe = (listener: () => void) => {
        this.#listeners.add(listener);
        return () => {
            this.#listeners.delete(listener);
        };
    }

    getSnapshot = () => {
        return this.#state;
    }

}