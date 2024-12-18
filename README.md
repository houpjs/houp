## Houp
[![Build Status](https://img.shields.io/github/actions/workflow/status/houpjs/houp/test.yml?branch=main)](https://github.com/houpjs/houp/actions?query=workflow%3Atest)
[![npm Package](https://img.shields.io/npm/v/houp.svg)](https://www.npmjs.org/package/houp) 
![NPM dev or peer Dependency Version](https://img.shields.io/npm/dependency-version/houp/peer/react)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/houpjs/houp/blob/master/LICENSE) 
![node](https://img.shields.io/node/v/houp) 

Houp(hook up) is a simple, fast and reliable solution that can make you share state among multiple components. Whether it is a new project or an existing project, adding Houp is very simple. Houp doesn't care how the state is created and managed, it just shares it.

```
npm install houp
```

## Add `<Provider />`

Add `<Provider />` to the top of the App. `<Provider />` is just a normal function component, not a Context Provider, so it does not need to wrap the App, which means that `<Provider />` and the App will not affect each other. But it should be noted that you must render it before the component that uses `useStore`, which is why you need to put it before the App.

``` tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import { Provider } from "houp"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider />
    <App />
  </StrictMode>,
)

```

## Register a store

Any React Hook can be registered as a store and then shared between components.

``` tsx
// useProduct.js
import { useCallback, useState } from "react";
import { registerStore } from "houp";

export default function useProduct() {
    const [price, setPrice] = useState(5);
    const [count, setCount] = useState(100);

    const update = useCallback(async () => {
        // await fetch(...)
        setPrice(100);
        setCount(30);
    }, []);

    return {
        price,
        count,
        update,
    };
}

registerStore(useProduct);
```

## Then use in your components, you're all done!

Use it in any component, because it is a React Hook, the component will re-render on changes.

``` tsx
import { useStore } from "houp";
import useProduct from "./useProduct";

export function ProductCount() {
    const store = useStore(useProduct);

    return (
        <>
            <div>count: {store.count}</div>
        </>
    );
}

export function ProductPrice() {
    const store = useStore(useProduct);

    return (
        <>
            <div>price: {store.price}</div>
        </>
    );
}

export function Updater() {
    const store = useStore(useProduct);

    return (
        <>
            <button onClick={store.updatePrice}>update price</button>
            <button onClick={() => store.setCount(n => n + 1)}>update count</button>
        </>
    );
}
```

> You may have noticed that `ProductCount` component will re-render even if you only click the `update price` button. Because `useStore` will fetching everything from the store that it will cause the component to re-render on every state change. If you want to re-render the component only when the `count` or `price` changes, you need to use `useStoreWithSelector`.

## useStoreWithSelector

Same as `useStore`, but supports selector and isEqual arguments. With the selector you can select any state you need from the store, and the component will be re-rendered only when the state you selected changes. It detects changes with shallow-equality by default, For more control over re-rendering, you can provide any custom equality function to the isEqual parameter.

``` tsx
useStoreWithSelector(hook, selector, isEqual);
```

Now, let's use `useStoreWithSelector` to optimize the above components.

``` tsx
import { useStore, useStoreWithSelector } from "houp";
import useProduct from "./useProduct";

export function ProductCount() {
    const store = useStoreWithSelector(useProduct, s => ({ count: s.count }));

    return (
        <>
            <div>count: {store.count}</div>
        </>
    );
}

export function ProductPrice() {
    const store = useStoreWithSelector(useProduct, s => ({ price: s.price }));

    return (
        <>
            <div>price: {store.price}</div>
        </>
    );
}

export function Updater() {
    const store = useStore(useProduct);

    return (
        <>
            <button onClick={store.updatePrice}>update price</button>
            <button onClick={() => store.setCount(n => n + 1)}>update count</button>
        </>
    );
}
```

## License

[MIT](LICENSE).
