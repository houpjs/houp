import { configure, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act, useState } from "react";
import { renderToString } from "react-dom/server";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
    configure({ reactStrictMode: Boolean(process.env.TEST_STRICT_MODE) });
})

describe("scoped store in SSR", () => {

    it("should throw error without scoped store in SSR", async () => {
        const { useStore } = await act(async () => await import("houp"));
        const hook = () => {
            return useState(1);
        };
        const Component = () => {
            const [count, setCount] = useStore(hook);
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
            expect((error as Error).message).toBe("Unable to find store (hook). This usually occurs when the StoreProvider is not added to the App.");
        }
    })

    let singleScopedComponentString = "";
    it("should work with a single scoped store. (get component string)", async () => {
        const { createProvider, useStore } = await act(async () => await import("houp"));
        const hook = () => {
            return useState(1);
        };
        const Provider = createProvider([hook]);
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
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <button data-testid="button2" onClick={() => setCount((count) => count + 1)}></button>
                    <div>count2:{count}</div>
                </>
            );
        }
        const view =
            <Provider>
                <Component1 />
                <Provider>
                    <Component2 />
                </Provider>
            </Provider>;
        const componentStr = renderToString(view);
        singleScopedComponentString = componentStr;
    })

    it("should work with a single scoped store.", async () => {
        const { createProvider, useStore } = await act(async () => await import("houp"));
        const user = userEvent.setup();
        const hook = () => {
            return useState(1);
        };
        const Provider = createProvider([hook]);
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
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <button data-testid="button2" onClick={() => setCount((count) => count + 1)}></button>
                    <div>count2:{count}</div>
                </>
            );
        }
        const view =
            <Provider>
                <Component1 />
                <Provider>
                    <Component2 />
                </Provider>
            </Provider>;
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
    it("should work with multiple scoped store. (get component string)", async () => {
        const { createProvider, useStore } = await act(async () => await import("houp"));
        const hook = () => {
            return useState(1);
        };
        const Provider = createProvider([hook]);
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
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <button data-testid={`button${props.id}`} onClick={() => setCount((count) => count + 1)}></button>
                    <div>{`count${props.id}`}:{count}</div>
                </>
            );
        }
        const view =
            <Provider>
                <Component1 />
                <Provider>
                    <Component2 id={2} />
                </Provider>
                <Provider>
                    <Component2 id={3} />
                </Provider>
            </Provider>;

        const componentStr = renderToString(view);
        multipleScopedComponentString = componentStr;
    })

    it("should work with multiple scoped store.", async () => {
        const { createProvider, useStore } = await act(async () => await import("houp"));
        const user = userEvent.setup();
        const hook = () => {
            return useState(1);
        };
        const Provider = createProvider([hook]);
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
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <button data-testid={`button${props.id}`} onClick={() => setCount((count) => count + 1)}></button>
                    <div>{`count${props.id}`}:{count}</div>
                </>
            );
        }
        const view =
            <Provider>
                <Component1 />
                <Provider>
                    <Component2 id={2} />
                </Provider>
                <Provider>
                    <Component2 id={3} />
                </Provider>
            </Provider>;
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

    let nestedScopedComponentString = "";
    it("should work with nested scoped store. (get component string)", async () => {
        const { createProvider, useStore } = await act(async () => await import("houp"));
        const hook = () => {
            return useState(1);
        };
        const Provider = createProvider([hook]);
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
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <button data-testid={`button${props.id}`} onClick={() => setCount((count) => count + 1)}></button>
                    <div>{`count${props.id}`}:{count}</div>
                </>
            );
        }
        const view =
            <Provider>
                <Component1 />
                <Provider>
                    <Component2 id={2} />
                    <Provider>
                        <Component2 id={3} />
                    </Provider>
                </Provider>
                <Provider>
                    <Component2 id={4} />
                </Provider>
            </Provider>;
        const componentStr = renderToString(view);
        nestedScopedComponentString = componentStr;
    })

    it("should work with nested scoped store.", async () => {
        const { createProvider, useStore } = await act(async () => await import("houp"));
        const user = userEvent.setup();
        const hook = () => {
            return useState(1);
        };
        const Provider = createProvider([hook]);
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
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <button data-testid={`button${props.id}`} onClick={() => setCount((count) => count + 1)}></button>
                    <div>{`count${props.id}`}:{count}</div>
                </>
            );
        }
        const view =
            <Provider>
                <Component1 />
                <Provider>
                    <Component2 id={2} />
                    <Provider>
                        <Component2 id={3} />
                    </Provider>
                </Provider>
                <Provider>
                    <Component2 id={4} />
                </Provider>
            </Provider>;
        const container = document.createElement("div")
        document.body.appendChild(container)
        container.innerHTML = nestedScopedComponentString;
        expect(container).toHaveTextContent("count1:1");
        expect(container).toHaveTextContent("count2:1");
        expect(container).toHaveTextContent("count3:1");
        expect(container).toHaveTextContent("count4:1");

        await act(async () => render(view, { hydrate: true, container }));
        await screen.findByText("count1:1");
        await screen.findByText("count2:1");
        await screen.findByText("count3:1");
        await screen.findByText("count4:1");
        await user.click(screen.getByTestId("button1"));
        await screen.findByText("count1:2");
        await screen.findByText("count2:1");
        await screen.findByText("count3:1");
        await screen.findByText("count4:1");
        await user.click(screen.getByTestId("button2"));
        await user.click(screen.getByTestId("button2"));
        await screen.findByText("count1:2");
        await screen.findByText("count2:3");
        await screen.findByText("count3:1");
        await screen.findByText("count4:1");
        await user.click(screen.getByTestId("button3"));
        await user.click(screen.getByTestId("button3"));
        await user.click(screen.getByTestId("button3"));
        await screen.findByText("count1:2");
        await screen.findByText("count2:3");
        await screen.findByText("count3:4");
        await screen.findByText("count4:1");
        await user.click(screen.getByTestId("button4"));
        await user.click(screen.getByTestId("button4"));
        await user.click(screen.getByTestId("button4"));
        await user.click(screen.getByTestId("button4"));
        await screen.findByText("count1:2");
        await screen.findByText("count2:3");
        await screen.findByText("count3:4");
        await screen.findByText("count4:5");
    })
})