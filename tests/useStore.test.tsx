import { render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
})

describe("useStore", () => {
    it("an error should be thrown if the store is not registered", async () => {
        const { useStore } = await import("houp");
        const hook = () => {
            return 1;
        };
        expect(() => renderHook(useStore, {
            initialProps: hook,
        })).toThrow("The store (hook) has not been registered yet. Did you forget to call registerStore to register it?");
    })

    it("should throw error if the store has been registered but has not been mounted", async () => {
        const { useStore, registerStore } = await import("houp");
        const hook = () => {
            return useState(1);
        };
        registerStore(hook);
        expect(() => renderHook(useStore, {
            initialProps: hook,
        })).toThrow("Unable to find store (hook). This usually occurs when the Provider is not added to the App or has been unmounted.");
    })

    it("a warning should be triggered if the store has been unmounted but not removed", async () => {
        const { useStore, registerStore, Provider } = await import("houp");
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        const hook = () => {
            return useState(1);
        };
        registerStore(hook);
        const { rerender } = render(
            <Provider />
        );
        const hookRender = renderHook(useStore, {
            initialProps: hook,
        });
        rerender(
            <></>
        );
        hookRender.rerender(hook);
        expect(consoleSpy).toBeCalledWith("The store (hook) has been unmounted from its Provider. This usually occurs when the Provider is unmounted, and you should avoid using a store that was registered to that Provider.");
    })

    it("an error should be thrown if the store is registered but the store provider has been unmounted", async () => {
        const { useStore, registerStore, Provider } = await import("houp");
        const hook = () => {
            return useState(1);
        };
        registerStore(hook);
        const { rerender } = render(
            <Provider />
        );
        const hookRender = renderHook(useStore, {
            initialProps: hook,
        });
        rerender(
            <></>
        );
        hookRender.unmount();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(() => renderHook(useStore, {
            initialProps: hook,
        })).toThrow("Unable to find store (hook). This usually occurs when the Provider is not added to the App or has been unmounted.");
    })

    it("it's fine if the hook returns null or undefined", async () => {
        const { useStore, registerStore, Provider } = await import("houp");
        const nullHook = () => {
            return null;
        };
        const undefinedHook = () => {
            return undefined;
        }
        registerStore(nullHook);
        registerStore(undefinedHook);
        const Component = () => {
            const nullValue = useStore(nullHook);
            const undefinedValue = useStore(undefinedHook);
            return (
                <>
                    <div>value:{nullValue === null ? "null" : "not null"}</div>
                    <div>value:{undefinedValue === undefined ? "undefined" : "not undefined"}</div>
                </>
            );
        }
        render(
            <>
                <Provider />
                <Component />
            </>
        );
        await screen.findByText("value:null");
        await screen.findByText("value:undefined");
    })

    it("use the store in a single location", async () => {
        const { useStore, registerStore, Provider } = await import("houp");
        const user = userEvent.setup();
        const hook = registerStore(() => {
            return useState(1);
        });
        const Component = () => {
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <button data-testid="button" onClick={() => setCount((count) => count + 1)}></button>
                    <div>count:{count}</div>
                </>
            );
        }
        render(
            <>
                <Provider />
                <Component />
            </>
        );
        await screen.findByText("count:1");
        const button = screen.getByTestId("button");
        await user.click(button);
        await screen.findByText("count:2");
    })

    it("the store can be shared across different components", async () => {
        const { useStore, registerStore, Provider } = await import("houp");
        const user = userEvent.setup();
        const hook = () => {
            return useState(1);
        };
        registerStore(hook);
        const Component = () => {
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <button data-testid="button" onClick={() => setCount((count) => count + 1)}></button>
                    <div>component count:{count}</div>
                </>
            );
        }
        const Component2 = () => {
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <button data-testid="button2" onClick={() => setCount((count) => count + 1)}></button>
                    <div>component2 count:{count}</div>
                </>
            );
        }
        render(
            <>
                <Provider />
                <Component />
                <Component2 />
            </>
        );
        await screen.findByText("component count:1");
        await screen.findByText("component2 count:1");
        const button = screen.getByTestId("button");
        await user.click(button);
        await screen.findByText("component count:2");
        await screen.findByText("component2 count:2");
        const button2 = screen.getByTestId("button2");
        await user.click(button2);
        await screen.findByText("component count:3");
        await screen.findByText("component2 count:3");
    })

    it("the hook can be updated", async () => {
        const { useStore, registerStore, Provider } = await import("houp");
        const user = userEvent.setup();
        const hook1 = () => {
            return useState(1);
        };
        const hook2 = () => {
            return useState(100);
        }
        registerStore(hook1);
        registerStore(hook2);
        const Component = (props: { hook: () => [number, React.Dispatch<React.SetStateAction<number>>] }) => {
            const [value, setValue] = useStore(props.hook);
            return (
                <>
                    <button data-testid="button" onClick={() => setValue((value) => value + 1)}></button>
                    <div>value:{value}</div>
                </>
            );
        }
        const { rerender } = render(
            <>
                <Provider />
                <Component hook={hook1} />
            </>
        );
        await screen.findByText("value:1");
        const button1 = screen.getByTestId("button");
        await user.click(button1);
        await screen.findByText("value:2");
        rerender(
            <>
                <Provider />
                <Component hook={hook2} />
            </>
        );
        await screen.findByText("value:100");
        const button2 = screen.getByTestId("button");
        await user.click(button2);
        await screen.findByText("value:101");
    })
})

describe("useStore with namespaced provider", () => {
    it("an error should be thrown if the store is registered but not mounted", async () => {
        const { useStore, registerStore } = await import("houp");
        const hook = () => {
            return useState(1);
        };
        registerStore(hook, "test");
        expect(() => renderHook(useStore, {
            initialProps: hook,
        })).toThrow("Unable to find store (hook). This usually occurs when the Provider is not added to the App or has been unmounted.");
    })

    it("a warning should be triggered if the store has been unmounted but not removed", async () => {
        const { useStore, registerStore, Provider } = await import("houp");
        const consoleSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });
        const hook = () => {
            return useState(1);
        };
        registerStore(hook, "test");
        const { rerender } = render(
            <Provider namespace="test" />
        );
        const hookRender = renderHook(useStore, {
            initialProps: hook,
        });
        rerender(
            <></>
        );
        hookRender.rerender(hook);
        expect(consoleSpy).toBeCalledWith("The store (hook) has been unmounted from its Provider. This usually occurs when the Provider is unmounted, and you should avoid using a store that was registered to that Provider.");
    })
})

describe("useStore with selector", () => {
    it("the component should not re-render if the selected value hasn't changed", async () => {
        const { useStore, registerStore, Provider } = await import("houp");
        const user = userEvent.setup();
        const ageEffectSpy = vi.fn();
        const heightEffectSpy = vi.fn();
        const hook = () => {
            const [age, setAge] = useState(12);
            const [height, setHeight] = useState(180);

            return {
                age,
                height,
                setAge,
                setHeight,
            };
        };
        registerStore(hook);
        const Component = () => {
            const state = useStore(hook,
                (state) => ({
                    age: state.age,
                    setAge: state.setAge,
                })
            );
            useEffect(() => {
                ageEffectSpy(state.age);
            }, [state.age])
            return (
                <>
                    <button data-testid="button" onClick={() => state.setAge((age) => age + 1)}></button>
                    <div>age:{state.age}</div>
                </>
            );
        }
        const Component2 = () => {
            const state = useStore(hook,
                (state) => ({
                    height: state.height,
                    setHeight: state.setHeight,
                })
            );
            useEffect(() => {
                heightEffectSpy(state.height);
            }, [state.height])
            return (
                <>
                    <button data-testid="button2" onClick={() => state.setHeight((height) => height + 1)}></button>
                    <div>height:{state.height}</div>
                </>
            );
        }
        render(
            <>
                <Provider />
                <Component />
                <Component2 />
            </>
        );
        await screen.findByText("age:12");
        await screen.findByText("height:180");
        const button = screen.getByTestId("button");
        let ageEffectSpyCallsLength = ageEffectSpy.mock.calls.length;
        let heightEffectSpyCallsLength = heightEffectSpy.mock.calls.length;
        await user.click(button);
        await user.click(button);
        await user.click(button);
        await screen.findByText("age:15");
        await screen.findByText("height:180");
        expect(ageEffectSpy).toHaveBeenLastCalledWith(15);
        expect(ageEffectSpy).toHaveBeenCalledTimes(ageEffectSpyCallsLength + 3)
        expect(heightEffectSpy).toHaveBeenCalledTimes(heightEffectSpyCallsLength)
        const button2 = screen.getByTestId("button2");
        await user.click(button2);
        await user.click(button2);
        await user.click(button2);
        await screen.findByText("age:15");
        await screen.findByText("height:183");
        expect(heightEffectSpy).toHaveBeenLastCalledWith(183);
        expect(heightEffectSpy).toHaveBeenCalledTimes(heightEffectSpyCallsLength + 3);
        expect(ageEffectSpy).toHaveBeenCalledTimes(ageEffectSpyCallsLength + 3)
    })

    it("can update selector", async () => {
        const { useStore, registerStore, Provider } = await import("houp");
        const hook = () => {
            const [age, setAge] = useState(12);
            const [height, setHeight] = useState(180);

            return {
                age,
                height,
                setAge,
                setHeight,
            };
        };
        registerStore(hook);
        const Component = (props: { selector: (state: any) => { value: number } }) => {
            const state = useStore(hook, props.selector);
            return (
                <>
                    <div>value:{state.value}</div>
                </>
            );
        }
        const { rerender } = render(
            <>
                <Provider />
                <Component selector={(state) => ({
                    value: state.age,
                })} />
            </>
        );
        await screen.findByText("value:12");
        rerender(
            <>
                <Provider />
                <Component selector={(state) => ({
                    value: state.height,
                })} />
            </>
        );
        await screen.findByText("value:180");
    })

    it("the isEqual function can be updated", async () => {
        const { useStore, registerStore, Provider } = await import("houp");
        const user = userEvent.setup();
        const hook = () => {
            const [value, setValue] = useState(0);

            return {
                value,
                setValue,
            };
        };
        registerStore(hook);
        let renderCount = 0;
        const Component = (props: { isEqual: (a: any, b: any) => boolean }) => {
            const state = useStore(hook, (s) => s, props.isEqual);
            return (
                <>
                    <button data-testid="button" onClick={() => state.setValue((value) => value + 1)}></button>
                    <div>renderCount:{++renderCount},value:{state.value}</div>
                </>
            );
        }
        const { rerender } = render(
            <>
                <Provider />
                <Component isEqual={() => true} />
            </>
        );
        await screen.findByText("renderCount:1,value:0");
        await user.click(screen.getByTestId("button"));
        await screen.findByText("renderCount:1,value:0");
        rerender(
            <>
                <Provider />
                <Component isEqual={() => false} />
            </>
        );
        await screen.findByText("renderCount:3,value:1");
        await user.click(screen.getByTestId("button"));
        await screen.findByText("renderCount:4,value:2");
    })
})