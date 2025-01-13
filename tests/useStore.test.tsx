import { configure, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act, useEffect, useState } from "react";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
    configure({ reactStrictMode: Boolean(process.env.TEST_STRICT_MODE) });
})

describe("useStore", () => {

    it("should throw error if the provider has not been added.", async () => {
        const { useStore } = await act(async () => await import("houp"));
        function hook() {
            return useState(0);
        }
        const Component = () => {
            const [count] = useStore(hook);
            return (
                <>
                    <div>value:{count}</div>
                </>
            );
        }
        try {
            await act(async () => render(<Component />));
            assert.fail("should throw error");
        } catch (error) {
            expect((error as Error).message).toBe("Unable to find store (hook). This usually occurs when the StoreProvider is not added to the App.");
        }
    })

    it("should throw error if the hook has not been added.", async () => {
        const { useStore, createProvider } = await act(async () => await import("houp"));
        function hook() {
            return useState(0);
        }
        const Provider = createProvider([]);
        const Component = () => {
            const [count] = useStore(hook);
            return (
                <>
                    <div>value:{count}</div>
                </>
            );
        }
        try {
            await act(async () => render(
                <Provider>
                    <Component />
                </Provider>
            ));
            assert.fail("should throw error");
        } catch (error) {
            expect((error as Error).message).toBe("Unable to find store (hook). Did you forget to add it when calling createProvider?");
        }
    })

    it("it's fine if the hook returns null or undefined", async () => {
        const { createProvider, useStore } = await act(async () => await import("houp"));
        const nullHook = () => {
            return null;
        };
        const undefinedHook = () => {
            return undefined;
        }
        const Provider = createProvider([nullHook, undefinedHook]);
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
        await act(async () => render(
            <Provider>
                <Component />
            </Provider>
        ));
        await screen.findByText("value:null");
        await screen.findByText("value:undefined");
    })

    it("use the store in a single location", async () => {
        const { createProvider, useStore } = await act(async () => await import("houp"));
        const user = userEvent.setup();
        const hook = () => {
            return useState(1);
        };
        const Provider = createProvider([hook]);
        const Component = () => {
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <button data-testid="button" onClick={() => setCount((count) => count + 1)}></button>
                    <div>count:{count}</div>
                </>
            );
        }
        await act(async () => render(
            <Provider>
                <Component />
            </Provider>
        ));
        await screen.findByText("count:1");
        const button = screen.getByTestId("button");
        await user.click(button);
        await screen.findByText("count:2");
    })

    it("should work call useStore in hook", async () => {
        const { createProvider, useStore } = await act(async () => await import("houp"));
        const user = userEvent.setup();
        const hook = () => {
            return useState(1);
        };
        const hook2 = (): [number, React.Dispatch<React.SetStateAction<number>>] => {
            const [count1] = useStore(hook);
            const [count2, setCount] = useState(10);

            return [
                count1 + count2,
                setCount,
            ];
        };
        const Provider = createProvider([hook, hook2]);
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
            const [count, setCount] = useStore(hook2);
            return (
                <>
                    <button data-testid="button2" onClick={() => setCount((count) => count + 1)}></button>
                    <div>count2:{count}</div>
                </>
            );
        }
        await act(async () => render(
            <Provider>
                <Component1 />
                <Component2 />
            </Provider>
        ));
        await screen.findByText("count1:1");
        await screen.findByText("count2:11");
        await user.click(screen.getByTestId("button1"));
        await screen.findByText("count1:2");
        await screen.findByText("count2:12");
        await user.click(screen.getByTestId("button2"));
        await screen.findByText("count1:2");
        await screen.findByText("count2:13");
    })

    it("should work fine if dynamically show and hide the component", async () => {
        const { useStore, createProvider } = await act(async () => await import("houp"));
        const user = userEvent.setup();
        const hook = () => {
            return useState(1);
        };
        const Provider = createProvider([hook]);
        const Component = () => {
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <button data-testid="button" onClick={() => setCount((count) => count + 1)}></button>
                    <div>count:{count}</div>
                </>
            );
        }
        const ComponentWrapper = () => {
            const [show, setShow] = useState(false);
            return (
                <>
                    <button data-testid="showButton" onClick={() => setShow((v) => !v)}></button>
                    {show && <Component />}
                </>
            );
        }
        await act(async () => render(
            <Provider>
                <ComponentWrapper />
            </Provider>
        ));
        await user.click(screen.getByTestId("showButton"));
        await screen.findByText("count:1");
        await user.click(screen.getByTestId("button"));
        await screen.findByText("count:2");
        await user.click(screen.getByTestId("showButton"));
        expect(screen.queryByText("count:2")).toBeNull();
        await user.click(screen.getByTestId("showButton"));
        await screen.findByText("count:2");

    });

    it("the store can be shared across different components", async () => {
        const { useStore, createProvider } = await act(async () => await import("houp"));
        const user = userEvent.setup();
        const hook = () => {
            return useState(1);
        };
        const Provider = createProvider([hook]);
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
        await act(async () => render(
            <Provider>
                <Component />
                <Component2 />
            </Provider>
        ));
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
        const { useStore, createProvider } = await act(async () => await import("houp"));
        const user = userEvent.setup();
        const hook1 = () => {
            return useState(1);
        };
        const hook2 = () => {
            return useState(100);
        }
        const Provider = createProvider([hook1, hook2]);
        const Component = (props: { hook: () => [number, React.Dispatch<React.SetStateAction<number>>] }) => {
            const [value, setValue] = useStore(props.hook);
            return (
                <>
                    <button data-testid="button" onClick={() => setValue((value) => value + 1)}></button>
                    <div>value:{value}</div>
                </>
            );
        }
        const { rerender } = await act(async () => render(
            <Provider>
                <Component hook={hook1} />
            </Provider>
        ));
        await screen.findByText("value:1");
        const button1 = screen.getByTestId("button");
        await user.click(button1);
        await screen.findByText("value:2");
        await act(async () => rerender(
            <Provider>
                <Component hook={hook2} />
            </Provider>
        ));
        await screen.findByText("value:100");
        const button2 = screen.getByTestId("button");
        await user.click(button2);
        await screen.findByText("value:101");
    })
})

describe("useStore with nested provider", () => {

    it("should work fine with nested provider", async () => {
        const { createProvider, useStore } = await act(async () => await import("houp"));
        const user = userEvent.setup();
        const hook = () => {
            return useState(1);
        };
        const Provider = createProvider([hook]);
        const Component = () => {
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
        const Component3 = () => {
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <button data-testid="button3" onClick={() => setCount((count) => count + 1)}></button>
                    <div>count3:{count}</div>
                </>
            );
        }
        const Component4 = () => {
            const [count, setCount] = useStore(hook);
            return (
                <>
                    <button data-testid="button4" onClick={() => setCount((count) => count + 1)}></button>
                    <div>count4:{count}</div>
                </>
            );
        }
        await act(async () => render(
            <Provider>
                <Component />
                <Provider>
                    <Component2 />
                    <Provider>
                        <Component3 />
                        <Provider>
                            <Component4 />
                        </Provider>
                    </Provider>
                </Provider>
            </Provider>
        ));
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

describe("useStore with selector", () => {
    it("the component should not re-render if the selected value hasn't changed", async () => {
        const { useStore, createProvider } = await act(async () => await import("houp"));
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
        const Provider = createProvider([hook]);
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
        await act(async () => render(
            <Provider>
                <Component />
                <Component2 />
            </Provider>
        ));
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
        const { useStore, createProvider } = await act(async () => await import("houp"));
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
        const Provider = createProvider([hook]);
        const Component = (props: { selector: (state: any) => { value: number } }) => {
            const state = useStore(hook, props.selector);
            return (
                <>
                    <div>value:{state.value}</div>
                </>
            );
        }
        const { rerender } = await act(async () => render(
            <Provider>
                <Component selector={(state) => ({
                    value: state.age,
                })} />
            </Provider>
        ));
        await screen.findByText("value:12");
        await act(async () => rerender(
            <Provider>
                <Component selector={(state) => ({
                    value: state.height,
                })} />
            </Provider>
        ));
        await screen.findByText("value:180");
    })

    it("the isEqual function can be updated", async () => {
        const { useStore, createProvider } = await act(async () => await import("houp"));
        const { shallowEqual } = await import("houp/shallowEqual");
        const user = userEvent.setup();
        const reactStrictMode = Boolean(process.env.TEST_STRICT_MODE);
        const hook = () => {
            const [value, setValue] = useState(0);

            return {
                value,
                setValue,
            };
        };
        const Provider = createProvider([hook]);
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
        const { rerender } = await act(async () => render(
            <Provider>
                <Component isEqual={() => true} />
            </Provider>
        ));
        await screen.findByText(`renderCount:${reactStrictMode ? 2 : 1},value:0`);
        await user.click(screen.getByTestId("button"));
        await screen.findByText(`renderCount:${reactStrictMode ? 2 : 1},value:0`);
        await act(async () => rerender(
            <Provider>
                <Component isEqual={() => false} />
            </Provider>
        ));
        await screen.findByText(`renderCount:${reactStrictMode ? 6 : 3},value:1`);
        await user.click(screen.getByTestId("button"));
        await screen.findByText(`renderCount:${reactStrictMode ? 8 : 4},value:2`);
        await act(async () => rerender(
            <Provider>
                <Component isEqual={shallowEqual} />
            </Provider>
        ));
        await screen.findByText(`renderCount:${reactStrictMode ? 10 : 5},value:2`);
        await user.click(screen.getByTestId("button"));
        await screen.findByText(`renderCount:${reactStrictMode ? 14 : 7},value:3`);
    })
})