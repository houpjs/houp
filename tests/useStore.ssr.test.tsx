import { render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
})

describe("useStore in ssr", () => {
    it("global provider should work good in ssr", async () => {
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

    it("separate provider should also work good in ssr", async () => {
        const { useStore, registerStore, CreateProvider } = await import("houp");
        const hook = () => {
            const [count, setCount] = useState(1);
            return {
                count,
                setCount,
            };
        };
        const MyProvider = CreateProvider();
        registerStore(hook, MyProvider);
        const Component = () => {
            const {count, setCount} = useStore(hook);

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
            <MyProvider />
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