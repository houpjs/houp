import { configure } from "@testing-library/react";
import { StoreMap } from "houp/provider/providerContext";
import { StandaloneStore } from "houp/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
    configure({ reactStrictMode: Boolean(process.env.TEST_STRICT_MODE) });
})

describe("StoreMap", () => {
    it("merge with same target", async () => {
        const hook = () => {
            return 1;
        }
        const hook2 = () => {
            return 2;
        }
        const currentStore = new StandaloneStore([hook]);
        const current = new StoreMap([hook], currentStore);
        const targetStore = new StandaloneStore([hook2]);
        const target = new StoreMap([hook2], targetStore);
        let oldMap = current.getMap();
        current.merge(target);
        expect(oldMap !== current.getMap()).toBe(true);
        expect(current.getMap().size).toBe(2);
        oldMap = current.getMap();
        current.merge(target);
        expect(oldMap !== current.getMap()).toBe(false);
    })

    it("merge with different target", async () => {
        const hook = () => {
            return 1;
        }
        const hook2 = () => {
            return 2;
        }
        const hook3 = () => {
            return 2;
        }
        const currentStore = new StandaloneStore([hook]);
        const current = new StoreMap([hook], currentStore);
        const targetStore = new StandaloneStore([hook2]);
        const target = new StoreMap([hook2], targetStore);
        const target2Store = new StandaloneStore([hook2]);
        const target2 = new StoreMap([hook2], target2Store);
        const target3Store = new StandaloneStore([hook2, hook3]);
        const target3 = new StoreMap([hook2, hook3], target3Store);
        let oldMap = current.getMap();
        current.merge(target);
        expect(oldMap !== current.getMap()).toBe(true);
        expect(current.getMap().size).toBe(2);
        oldMap = current.getMap();
        current.merge(target2);
        expect(oldMap !== current.getMap()).toBe(true);
        expect(current.getMap().size).toBe(2);
        current.merge(target3);
        expect(oldMap !== current.getMap()).toBe(true);
        expect(current.getMap().size).toBe(3);
    })
})