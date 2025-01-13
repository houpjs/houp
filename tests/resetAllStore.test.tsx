import { act, configure, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
    configure({ reactStrictMode: Boolean(process.env.TEST_STRICT_MODE) });
})

describe("resetAllStore", () => {
    it("should work fine.", async () => {
        const { useStore, createProvider, useProvider } = await act(async () => await import("houp"));
        const user = userEvent.setup();
        function hook() {
            return useState(0);
        }
        function hook2() {
            return useState(0);
        }
        const Provider = createProvider([hook, hook2]);
        const Component = () => {
            const [count, setCount] = useStore(hook);
            const provider = useProvider(hook);
            return (
                <>
                    <div>value:{count}</div>
                    <button data-testid="button" onClick={() => setCount((c) => c + 1)}></button>
                    <button data-testid="button2" onClick={() => provider.resetAllStore()}></button>
                </>
            );
        }
        const Component2 = () => {
            const [count, setCount] = useStore(hook2);
            return (
                <>
                    <div>value2:{count}</div>
                    <button data-testid="button3" onClick={() => setCount((c) => c + 1)}></button>
                </>
            );
        }
        await act(async () => render(
            <Provider>
                <Component />
                <Component2 />
            </Provider>
        ));
        await screen.findByText("value:0");
        await screen.findByText("value2:0");
        await user.click(screen.getByTestId("button"));
        await user.click(screen.getByTestId("button3"));
        await screen.findByText("value:1");
        await screen.findByText("value2:1");
        await user.click(screen.getByTestId("button2"));
        await screen.findByText("value:0");
        await screen.findByText("value2:0");
        await user.click(screen.getByTestId("button"));
        await user.click(screen.getByTestId("button3"));
        await screen.findByText("value:1");
        await screen.findByText("value2:1");
        await user.click(screen.getByTestId("button2"));
        await screen.findByText("value:0");
        await screen.findByText("value2:0");
        await user.click(screen.getByTestId("button"));
        await user.click(screen.getByTestId("button3"));
        await screen.findByText("value:1");
        await screen.findByText("value2:1");
    })

})
