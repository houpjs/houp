import { act, render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
})

describe("useStore in ssr", () => {
    let globalComponentString = "";
    it("the global provider should work properly in SSR (get component string)", async () => {
        const oldDocument = document;
        document = undefined as any;
        const { useStore } = await import("houp");
        const hook = () => {
            return useState(1);
        };
        const Component = () => {
            const [count, setCount] = useStore(hook);

            useEffect(() => {
                setCount(100);
            }, [setCount])

            return (
                <>
                    <div>count:{count}</div>
                </>
            );
        }
        const view = <>
            <Component />
        </>;

        const componentStr = renderToString(view);
        globalComponentString = componentStr;
        document = oldDocument;
    })

    it("the global provider should work properly in SSR", async () => {
        const { useStore } = await act(async () => await import("houp"));
        const hook = () => {
            return useState(1);
        };
        const Component = () => {
            const [count, setCount] = useStore(hook);

            useEffect(() => {
                setCount(100);
            }, [setCount])

            return (
                <>
                    <div>count:{count}</div>
                </>
            );
        }
        const view = <>
            <Component />
        </>;

        const container = document.createElement("div")
        document.body.appendChild(container)
        container.innerHTML = globalComponentString;
        expect(container).toHaveTextContent("count:1");
        await act(async () => render(view, { hydrate: true, container }));
        await screen.findByText("count:100");
    })

    let standaloneComponentString = "";
    it("standalone provider should also work properly in SSR (get component string)", async () => {
        const oldDocument = document;
        document = undefined as any;
        const { createStore } = await import("houp");
        const store = createStore();
        const hook = () => {
            const [count, setCount] = useState(1);
            return {
                count,
                setCount,
            };
        };
        const Component = () => {
            const { count, setCount } = store.useStore(hook);

            useEffect(() => {
                setCount(100);
            }, [setCount])

            return (
                <>
                    <div>count:{count}</div>
                </>
            );
        }
        const view = <>
            <Component />
        </>;

        const componentStr = renderToString(view);
        standaloneComponentString = componentStr;
        document = oldDocument;
    })

    it("standalone provider should also work properly in SSR", async () => {
        const { createStore } = await act(async () => await import("houp"));
        const store = await act(async () => createStore());
        const hook = () => {
            const [count, setCount] = useState(1);
            return {
                count,
                setCount,
            };
        };
        const Component = () => {
            const { count, setCount } = store.useStore(hook);

            useEffect(() => {
                setCount(100);
            }, [setCount])

            return (
                <>
                    <div>count:{count}</div>
                </>
            );
        }
        const view = <>
            <Component />
        </>;

        const container = document.createElement("div")
        document.body.appendChild(container)
        container.innerHTML = standaloneComponentString;
        expect(container).toHaveTextContent("count:1");

        await act(async () => render(view, { hydrate: true, container }));
        await screen.findByText("count:100");
    })
})