## Houp
[![Build Status](https://img.shields.io/github/actions/workflow/status/houpjs/houp/test.yml?branch=main)](https://github.com/houpjs/houp/actions?query=workflow%3Atest)
[![npm Package](https://img.shields.io/npm/v/houp.svg)](https://www.npmjs.org/package/houp) 
![NPM dev or peer Dependency Version](https://img.shields.io/npm/dependency-version/houp/peer/react)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/houpjs/houp/blob/master/LICENSE) 
![node](https://img.shields.io/node/v/houp) 

Houp (hook up) is a simple, fast, and reliable solution for sharing a hook's state across multiple components. Whether you're working on a new project or an existing one, integrating Houp is straightforward. It doesn't matter how the hook is created or managed — Houp focuses solely on sharing it. [Read the Docs to Learn More](https://houp.js.org).

```
npm install houp
```

## Play in Codesandbox

[![Edit houp-sample](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/p/sandbox/infallible-villani-89k5vf)


## Create your hook

Any React hook can be used as a store and shared across components.

```tsx
// useProduct.ts
import { useState } from "react";

export default function useProduct() {
    const [price, setPrice] = useState(5);
    const [count, setCount] = useState(100);

    const updatePrice = async () => {
        // await fetch(...)
        setPrice(n => n + 1);
    };

    return {
        price,
        count,
        updatePrice,
        setCount,
    };
}
```

## Create a Provider

`createProvider` creates a `StoreProvider` component that provides the store to its child components. It takes an array of hooks as a parameter, which will be used as the store. Now, we pass `useProduct` as a parameter to `createProvider`.

```tsx
// provider.ts
import useProduct from "./useProduct";
import { createProvider } from "houp";

export const Provider = createProvider([useProduct]);
```

## Add the Provider to your app

We add the `Provider` at the root of our app so that we can use the store anywhere within the app.

```tsx
// main.tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import { Provider } from "./provider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider>
      <App />
    </Provider>
  </StrictMode>,
)
```

## Now, use it in your components, and you're all set!

Since it's a React Hook, you can use it in any component, and the component will re-render when the state changes.

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

> You may have noticed that the `ProductCount` component re-renders even when you click the `update price` button. This happens because `useStore` fetches all the data from the store, causing the component to re-render on every state change. To re-render the component only when specific state values like `count` or `price` change, you should use `useStore` with a selector.

## Using `useStore` with a selector

`useStore` supports both a `selector` and an `isEqual` argument. The `selector` allows you to choose specific state from the store, so the component will only re-render when the selected state changes. By default, it detects changes using shallow equality. For more control over re-rendering, you can provide a custom equality function via the `isEqual` parameter.

``` tsx
useStore(hook, selector?, isEqual?);
```

Now, let's use `selector` to optimize the components mentioned above.

``` tsx
import { useStore } from "houp";
import useProduct from "./useProduct";

export function ProductCount() {
    const store = useStore(useProduct, s => ({ count: s.count }));

    return (
        <>
            <div>count: {store.count}</div>
        </>
    );
}

export function ProductPrice() {
    const store = useStore(useProduct, s => ({ price: s.price }));

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
