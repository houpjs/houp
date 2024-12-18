import { shallowEqual } from "houp/shallowEqual";
import { describe, expect, it } from "vitest";

describe("shallowEqual", () => {
    it("work with primitive type", () => {
        expect(shallowEqual(1, 1)).toBe(true);
        expect(shallowEqual(1, 0)).toBe(false);
        expect(shallowEqual(true, true)).toBe(true);
        expect(shallowEqual(false, false)).toBe(true);
        expect(shallowEqual(false, true)).toBe(false);
        expect(shallowEqual(NaN, NaN)).toBe(true);
        expect(shallowEqual(NaN, 1)).toBe(false);
        expect(shallowEqual(undefined, undefined)).toBe(true);
        expect(shallowEqual(undefined, null)).toBe(false);
        expect(shallowEqual(undefined, "")).toBe(false);
        expect(shallowEqual(null, "")).toBe(false);
        expect(shallowEqual("", "")).toBe(true);
        expect(shallowEqual(false, "")).toBe(false);
    })

    it("work with array", () => {
        expect(shallowEqual([], [])).toBe(true);
        expect(shallowEqual([null], [null])).toBe(true);
        expect(shallowEqual([undefined], [undefined])).toBe(true);
        expect(shallowEqual([NaN], [NaN])).toBe(true);
        expect(shallowEqual([1, 2], [1, 2])).toBe(true);
        expect(shallowEqual(["1", "2"], ["1", "2"])).toBe(true);
        const a = {};
        const b = {};
        expect(shallowEqual([a, b], [a, b])).toBe(true);
        expect(shallowEqual([a, b], [a, {}])).toBe(false);
        expect(shallowEqual([1, 2, 3], [1, 2])).toBe(false);
        expect(shallowEqual([1, 2, 3], [3, 1, 2])).toBe(false);
        expect(shallowEqual([], "")).toBe(false);
        expect(shallowEqual([], undefined)).toBe(false);
        expect(shallowEqual([], null)).toBe(false);
        expect(shallowEqual([], NaN)).toBe(false);
    })

    it("work with object", () => {
        expect(shallowEqual({}, {})).toBe(true);
        expect(shallowEqual({ a: 1 }, { a: 1 })).toBe(true);
        expect(shallowEqual({ a: "1" }, { a: "1" })).toBe(true);
        const funA = () => { };
        expect(shallowEqual({ a: funA }, { a: funA })).toBe(true);
        const obj = { age: 1 };
        expect(shallowEqual({ a: obj }, { a: obj })).toBe(true);
        expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
        expect(shallowEqual({ a: {} }, { a: {} })).toBe(false);
        expect(shallowEqual({ a: () => { } }, { a: () => { } })).toBe(false);
        expect(shallowEqual({}, null)).toBe(false);
        expect(shallowEqual({}, undefined)).toBe(false);
        expect(shallowEqual({}, NaN)).toBe(false);
        expect(shallowEqual({}, "")).toBe(false);
        expect(shallowEqual({}, 1)).toBe(false);
        expect(shallowEqual({}, false)).toBe(false);
        expect(shallowEqual(new Set(), new Set())).toBe(false);
        expect(shallowEqual(new Map(), new Map())).toBe(false);
    })
});