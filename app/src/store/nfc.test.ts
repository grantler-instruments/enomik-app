import { beforeEach, describe, expect, it } from "vitest";
import { useMIDIStore } from "./midi";
import { useNfcStore } from "./nfc";

const mapping = {
	uid: "04 A2 3B 1C",
	type: 0x9,
	channel: 1,
	data1: 60,
	data2: 100,
} as const;

describe("nfc store", () => {
	beforeEach(() => {
		useNfcStore.setState({
			mappingMode: undefined,
			currentTag: undefined,
			mappings: {},
			log: [],
			tableFull: undefined,
			loading: false,
			loaded: {},
			fileMappings: {},
		});
	});

	it("tracks the tag on the reader", () => {
		const { handleEvent } = useNfcStore.getState();
		handleEvent({ kind: "placed", uid: "AA" });
		expect(useNfcStore.getState().currentTag).toBe("AA");
		handleEvent({ kind: "removed", uid: "BB" });
		expect(useNfcStore.getState().currentTag).toBe("AA");
		handleEvent({ kind: "removed", uid: "AA" });
		expect(useNfcStore.getState().currentTag).toBeUndefined();
		expect(useNfcStore.getState().log).toHaveLength(3);
	});

	it("keeps confirmed mappings and clears them on count 0", () => {
		const { handleEvent } = useNfcStore.getState();
		handleEvent({ kind: "mapped", ...mapping });
		expect(useNfcStore.getState().mappings).toEqual({ [mapping.uid]: mapping });
		handleEvent({ kind: "count", count: 32 });
		expect(useNfcStore.getState().tableFull).toBe(32);
		expect(useNfcStore.getState().mappings).not.toEqual({});
		handleEvent({ kind: "count", count: 0 });
		expect(useNfcStore.getState().mappings).toEqual({});
		expect(useNfcStore.getState().tableFull).toBeUndefined();
	});

	it("follows mapping mode and forgets the tag on change", () => {
		const { handleEvent } = useNfcStore.getState();
		handleEvent({ kind: "mapping_state", on: true });
		handleEvent({ kind: "placed", uid: "AA" });
		handleEvent({ kind: "mapping_state", on: false });
		expect(useNfcStore.getState().mappingMode).toBe(false);
		expect(useNfcStore.getState().currentTag).toBeUndefined();
	});

	it("replaces the table with a listed one", () => {
		const { handleEvent, startLoading } = useNfcStore.getState();
		handleEvent({ kind: "mapped", ...mapping, uid: "OLD" });
		startLoading();
		handleEvent({ kind: "mapped", ...mapping });
		// Old table shown until the list ends.
		expect(Object.keys(useNfcStore.getState().mappings)).toEqual(["OLD"]);
		handleEvent({ kind: "count", count: 1 });
		const state = useNfcStore.getState();
		expect(state.mappings).toEqual({ [mapping.uid]: mapping });
		expect(state.loading).toBe(false);
		expect(state.tableFull).toBeUndefined();
		expect(state.log[0]).toMatchObject({ listEnd: true });
		// Listed entries aren't logged one by one.
		expect(state.log).toHaveLength(2);
	});

	it("an empty list empties the table", () => {
		const { handleEvent, startLoading } = useNfcStore.getState();
		handleEvent({ kind: "mapped", ...mapping });
		startLoading();
		handleEvent({ kind: "count", count: 0 });
		expect(useNfcStore.getState().mappings).toEqual({});
	});

	it("readies a loaded file's message when its tag is placed", () => {
		const { loadFile, handleEvent } = useNfcStore.getState();
		const saved = { ...mapping, type: 0xb, data1: 7, data2: 99 } as const;
		loadFile([saved], { [saved.uid]: "volume" });
		expect(useNfcStore.getState().labels[saved.uid]).toBe("volume");
		handleEvent({ kind: "placed", uid: saved.uid });
		expect(useMIDIStore.getState()).toMatchObject({
			composerType: 0xb0,
			composerChannel: 1,
			composerNoteOrCc: 7,
			composerVelocityOrValue: 99,
		});
	});
});
