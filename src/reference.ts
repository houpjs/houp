
export interface IReference<T> {
    increase: (target: T) => void;
    decrease: (target: T) => void;
    getReference: (target: T) => number;
}


export class Reference<T> implements IReference<T> {
    #reference = new Map<T, number>();

    increase = (target: T) => {
        const count = this.#reference.get(target) ?? 0;
        this.#reference.set(target, count + 1);
    }

    decrease = (target: T) => {
        const count = this.#reference.get(target) ?? 0;
        this.#reference.set(target, count - 1);
    }

    getReference = (target: T) => {
        return this.#reference.get(target) ?? 0;
    }

    remove = (target: T) => {
        this.#reference.delete(target);
    }

    clear = () => {
        this.#reference.clear();
    }
}