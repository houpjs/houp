import { act, configure, render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
    configure({ reactStrictMode: Boolean(process.env.TEST_STRICT_MODE) });
})

describe("useStore in ssr", () => {
    let defaultComponentString = "";
    it("should work properly in SSR (get component string)", async () => {
        const { useStore, createProvider } = await import("houp");
        const hook = () => {
            return useState(1);
        };
        const Provider = createProvider([hook]);
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
        const view = <Provider>
            <Component />
        </Provider>;

        const componentStr = renderToString(view);
        defaultComponentString = componentStr;
    })

    it("should work properly in SSR", async () => {
        const { useStore, createProvider } = await act(async () => await import("houp"));
        const hook = () => {
            return useState(1);
        };
        const Provider = createProvider([hook]);
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
        const view = <Provider>
            <Component />
        </Provider>;

        const container = document.createElement("div")
        document.body.appendChild(container)
        container.innerHTML = defaultComponentString;
        expect(container).toHaveTextContent("count:1");
        await act(async () => render(view, { hydrate: true, container }));
        await screen.findByText("count:100");
    })
})