import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { NfcEvent, NfcMapping } from "../utils/nfc";
import { useMIDIStore } from "./midi";

export interface NfcLogEntry {
	id: number;
	timestamp: number;
	event: NfcEvent;
	/** The count ends a mapping list, not a delete or a full table. */
	listEnd?: boolean;
}

interface NfcState {
	outputId: string;
	/** Last state the client reported; undefined until it answers. */
	mappingMode?: boolean;
	/** Tag on the reader (mapping mode only reports tags). */
	currentTag?: string;
	/** The client's mapping table, by UID, as last listed or confirmed. */
	mappings: Record<string, NfcMapping>;
	/** A mapping list was requested; entries collect in `loaded` until the count. */
	loading: boolean;
	loaded: Record<string, NfcMapping>;
	labels: Record<string, string>;
	/** Mappings from a loaded file, by UID; written tag by tag in mapping mode. */
	fileMappings: Record<string, NfcMapping>;
	log: NfcLogEntry[];
	/** Set when the client reports a full table. */
	tableFull?: number;
	setOutputId: (id: string) => void;
	setLabel: (uid: string, label: string) => void;
	loadFile: (mappings: NfcMapping[], labels: Record<string, string>) => void;
	dismissFile: () => void;
	handleEvent: (event: NfcEvent) => void;
	/** Call right before sending GET_MAPPINGS. */
	startLoading: () => void;
	stopLoading: () => void;
	clearLog: () => void;
}

const MAX_LOG = 200;

/**
 * A tag mapped in mapping mode (not one entry of a listed table): the board
 * stored it, so mapping mode can end.
 */
export const leavesMappingMode = (
	state: Pick<NfcState, "mappingMode" | "loading">,
	event: NfcEvent,
) => event.kind === "mapped" && !!state.mappingMode && !state.loading;

/** Puts a mapping's message into the MIDI composer. */
export function fillComposer(m: NfcMapping) {
	useMIDIStore.setState({
		composerType: m.type << 4,
		composerChannel: m.channel,
		composerNoteOrCc: m.data1,
		composerVelocityOrValue: m.data2,
	});
}
let logId = 0;

export const useNfcStore = create<NfcState>()(
	devtools(
		persist(
			(set, get) => ({
				outputId: "",
				mappings: {},
				loading: false,
				loaded: {},
				labels: {},
				fileMappings: {},
				log: [],
				setOutputId: (outputId) => set({ outputId }),
				setLabel: (uid, label) =>
					set((s) => ({ labels: { ...s.labels, [uid]: label } })),
				loadFile: (mappings, labels) =>
					set((s) => ({
						labels: { ...s.labels, ...labels },
						fileMappings: Object.fromEntries(mappings.map((m) => [m.uid, m])),
					})),
				dismissFile: () => set({ fileMappings: {} }),
				startLoading: () => set({ loading: true, loaded: {} }),
				stopLoading: () => set({ loading: false, loaded: {} }),
				handleEvent: (event) => {
					// A tag from a loaded file: ready its message in the composer.
					const saved =
						event.kind === "placed" ? get().fileMappings[event.uid] : undefined;
					if (saved) fillComposer(saved);
					set((s) => {
						const listEnd = s.loading && event.kind === "count";
						const log =
							s.loading && event.kind === "mapped"
								? s.log
								: [
										{ id: ++logId, timestamp: Date.now(), event, listEnd },
										...s.log,
									].slice(0, MAX_LOG);
						switch (event.kind) {
							case "placed":
								return { log, currentTag: event.uid };
							case "removed":
								return {
									log,
									currentTag:
										s.currentTag === event.uid ? undefined : s.currentTag,
								};
							case "deleted": {
								const { [event.uid]: _, ...mappings } = s.mappings;
								return { log, mappings };
							}
							case "mapping_state":
								return {
									log,
									mappingMode: event.on,
									currentTag: undefined,
									tableFull: undefined,
								};
							case "mapped": {
								const { kind: _, ...mapping } = event;
								if (s.loading)
									return {
										log,
										loaded: { ...s.loaded, [mapping.uid]: mapping },
									};
								return {
									log,
									mappings: { ...s.mappings, [mapping.uid]: mapping },
									tableFull: undefined,
								};
							}
							case "count":
								// Ends a list; else 0: all deleted, more: the table is full.
								if (listEnd)
									return {
										log,
										mappings: s.loaded,
										loading: false,
										loaded: {},
										tableFull: undefined,
									};
								return event.count === 0
									? { log, mappings: {}, tableFull: undefined }
									: { log, tableFull: event.count };
						}
					});
				},
				clearLog: () => set({ log: [] }),
			}),
			{
				name: "nfc-storage",
				partialize: (s) => ({
					outputId: s.outputId,
					mappings: s.mappings,
					labels: s.labels,
					fileMappings: s.fileMappings,
				}),
			},
		),
		{ name: "NfcStore" },
	),
);
