import { configure, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act, useState } from "react";
import { renderToString } from "react-dom/server";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
    configure({ reactStrictMode: Boolean(process.env.TEST_STRICT_MODE) });
})

describe("useScopedStore in SSR", () => {

    it("should throw error without ScopedStore in SSR", async () => {
        const oldDocument = document;
        document = undefined as any;
        const { useScopedStore, registerStore } = await act(async () => await import("houp"));
        const hook = () => {
            return useState(1);
        };
        registerStore(hook);
        const Component = () => {
            const scopedStore = useScopedStore();
            const [count, setCount] = scopedStore.useStore(hook);
            return (
                <>
                    <button data-testid="button" onClick={() => setCount((count) => count + 1)}></button>
                    <div>count:{count}</div>
                </>
            );
        }
        try {
            renderToString(
                <>
                    <Component />
                </>
            );
            assert.fail("should throw error");
        } catch (error) {
            expect((error as Error).message).toBe("useScopedStore can only be used within a ScopedStore component.");
        }
        document = oldDocument;
    })

    let singleScopedComponentString = "";
    it("should work with a single ScopedStore. (get component string)", async () => {
        const oldDocument = document;
        document = undefined as any;
        const { createScopedStore, useScopedStore, useStore, registerStore } = await act(async () => await import("houp"));
        const hook = () => {
            return useState(1);
        };
        registerStore(hook);
        const ScopedStore = createScopedStore(hook);
        const Component1 = () => {
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <button data-testid="button1" onClick={() => setCount((count) => count + 1)}></button>
                    <div>count1:{count}</div>
                </>
            );
        }
        const Component2 = () => {
            const scopedStore = useScopedStore();
            const [count, setCount] = scopedStore.useStore(hook);
            return (
                <>
                    <button data-testid="button2" onClick={() => setCount((count) => count + 1)}></button>
                    <div>count2:{count}</div>
                </>
            );
        }
        const view =
            <>
                <Component1 />
                <ScopedStore>
                    <Component2 />
                </ScopedStore>
            </>;
        const componentStr = renderToString(view);
        singleScopedComponentString = componentStr;
        document = oldDocument;
    })

    it("should work with a single ScopedStore.", async () => {
        const { createScopedStore, useScopedStore, useStore, registerStore } = await act(async () => await import("houp"));
        const user = userEvent.setup();
        const hook = () => {
            return useState(1);
        };
        await act(async () => registerStore(hook));
        const ScopedStore = createScopedStore(hook);
        const Component1 = () => {
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <button data-testid="button1" onClick={() => setCount((count) => count + 1)}></button>
                    <div>count1:{count}</div>
                </>
            );
        }
        const Component2 = () => {
            const scopedStore = useScopedStore();
            const [count, setCount] = scopedStore.useStore(hook);
            return (
                <>
                    <button data-testid="button2" onClick={() => setCount((count) => count + 1)}></button>
                    <div>count2:{count}</div>
                </>
            );
        }
        const view =
            <>
                <Component1 />
                <ScopedStore>
                    <Component2 />
                </ScopedStore>
            </>;
        const container = document.createElement("div")
        document.body.appendChild(container)
        container.innerHTML = singleScopedComponentString;
        expect(container).toHaveTextContent("count1:1");
        expect(container).toHaveTextContent("count2:1");

        await act(async () => render(view, { hydrate: true, container }));
        await screen.findByText("count1:1");
        await screen.findByText("count2:1");
        await user.click(screen.getByTestId("button1"));
        await screen.findByText("count1:2");
        await screen.findByText("count2:1");
        await user.click(screen.getByTestId("button2"));
        await user.click(screen.getByTestId("button2"));
        await screen.findByText("count1:2");
        await screen.findByText("count2:3");
    })

    let multipleScopedComponentString = "";
    it("should work with multiple ScopedStore. (get component string)", async () => {
        const oldDocument = document;
        document = undefined as any;
        const { createScopedStore, useScopedStore, useStore, registerStore } = await act(async () => await import("houp"));
        const hook = () => {
            return useState(1);
        };
        registerStore(hook);
        const ScopedStore = createScopedStore(hook);
        const Component1 = () => {
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <button data-testid="button1" onClick={() => setCount((count) => count + 1)}></button>
                    <div>count1:{count}</div>
                </>
            );
        }
        const Component2 = (props: { id: number }) => {
            const scopedStore = useScopedStore();
            const [count, setCount] = scopedStore.useStore(hook);
            return (
                <>
                    <button data-testid={`button${props.id}`} onClick={() => setCount((count) => count + 1)}></button>
                    <div>{`count${props.id}`}:{count}</div>
                </>
            );
        }
        const view =
            <>
                <Component1 />
                <ScopedStore>
                    <Component2 id={2} />
                </ScopedStore>
                <ScopedStore>
                    <Component2 id={3} />
                </ScopedStore>
            </>;

        const componentStr = renderToString(view);
        multipleScopedComponentString = componentStr;
        document = oldDocument;
    })

    it("should work with multiple ScopedStore.", async () => {
        const { createScopedStore, useScopedStore, useStore, registerStore } = await act(async () => await import("houp"));
        const user = userEvent.setup();
        const hook = () => {
            return useState(1);
        };
        await act(async () => registerStore(hook));
        const ScopedStore = createScopedStore(hook);
        const Component1 = () => {
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <button data-testid="button1" onClick={() => setCount((count) => count + 1)}></button>
                    <div>count1:{count}</div>
                </>
            );
        }
        const Component2 = (props: { id: number }) => {
            const scopedStore = useScopedStore();
            const [count, setCount] = scopedStore.useStore(hook);
            return (
                <>
                    <button data-testid={`button${props.id}`} onClick={() => setCount((count) => count + 1)}></button>
                    <div>{`count${props.id}`}:{count}</div>
                </>
            );
        }
        const view =
            <>
                <Component1 />
                <ScopedStore>
                    <Component2 id={2} />
                </ScopedStore>
                <ScopedStore>
                    <Component2 id={3} />
                </ScopedStore>
            </>;
        const container = document.createElement("div")
        document.body.appendChild(container)
        container.innerHTML = multipleScopedComponentString;
        expect(container).toHaveTextContent("count1:1");
        expect(container).toHaveTextContent("count2:1");
        expect(container).toHaveTextContent("count3:1");

        await act(async () => render(view, { hydrate: true, container }));
        await screen.findByText("count1:1");
        await screen.findByText("count2:1");
        await screen.findByText("count3:1");
        await user.click(screen.getByTestId("button1"));
        await screen.findByText("count1:2");
        await screen.findByText("count2:1");
        await screen.findByText("count3:1");
        await user.click(screen.getByTestId("button2"));
        await user.click(screen.getByTestId("button2"));
        await screen.findByText("count1:2");
        await screen.findByText("count2:3");
        await screen.findByText("count3:1");
        await user.click(screen.getByTestId("button3"));
        await user.click(screen.getByTestId("button3"));
        await user.click(screen.getByTestId("button3"));
        await screen.findByText("count1:2");
        await screen.findByText("count2:3");
        await screen.findByText("count3:4");
    })

})