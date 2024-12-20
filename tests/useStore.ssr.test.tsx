import { render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
})

describe("useStore in ssr", () => {
    it("the global provider should work properly in SSR", async () => {
        const { useStore, registerStore, Provider } = await import("houp");
        const hook = () => {
            return useState(1);
        };
        registerStore(hook);
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
            <Provider />
            <Component />
        </>;

        const componentStr = renderToString(view);

        const container = document.createElement("div")
        document.body.appendChild(container)
        container.innerHTML = componentStr;
        expect(container).toHaveTextContent("count:1");

        render(view, { hydrate: true, container });
        await screen.findByText("count:100");
    })

    it("namespaced provider should also work properly in SSR", async () => {
        const { useStore, registerStore, Provider } = await import("houp");
        const hook = () => {
            const [count, setCount] = useState(1);
            return {
                count,
                setCount,
            };
        };
        registerStore(hook, "test");
        const Component = () => {
            const { count, setCount } = useStore(hook);

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
            <Provider namespace="test" />
            <Component />
        </>;

        const componentStr = renderToString(view);

        const container = document.createElement("div")
        document.body.appendChild(container)
        container.innerHTML = componentStr;
        expect(container).toHaveTextContent("count:1");

        render(view, { hydrate: true, container });
        await screen.findByText("count:100");
    })
})