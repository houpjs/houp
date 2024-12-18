
function arrayEquals(a: unknown[], b: unknown[]): boolean {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (!Object.is(a[i], b[i])) {
            return false;
        }
    }
    return true;
}

export function shallowEqual(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) {
        return true;
    }
    if (a === null ||
        b === null) {
        return false;
    }
    if (a instanceof Set ||
        a instanceof Map ||
        b instanceof Set ||
        b instanceof Map) {
        return false;
    }
    if (Array.isArray(a) &&
        Array.isArray(b)) {
        return arrayEquals(a, b);
    }
    if (typeof a === "object" &&
        typeof b === "object") {
        const aKeys = Object.keys(a) as never[];
        const bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length) {
            return false;
        }
        for (const key of aKeys) {
            if (!Object.prototype.hasOwnProperty.call(b, key) ||
                !Object.is(a[key], b[key])) {
                return false;
            }
        }
        return true;
    }

    return false;
}