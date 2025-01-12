
export class Signal<T> {

    #waitingTasks = new Map<T, { task: Promise<void>, complete: () => void }>();

    wait = async (target: T) => {
        let taskItem = this.#waitingTasks.get(target);
        if (!taskItem) {
            let complete!: () => void;
            const task = new Promise<void>((resolve) => {
                complete = () => {
                    resolve();
                }
            });
            taskItem = {
                task,
                complete,
            };
            this.#waitingTasks.set(target, taskItem);
        }
        return taskItem.task;
    }

    dispatch = (target: T) => {
        const taskItem = this.#waitingTasks.get(target);
        if (taskItem) {
            taskItem.complete();
        }
    }

    remove = (target: T) => {
        this.#waitingTasks.delete(target);
    }
}