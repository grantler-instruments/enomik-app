import {
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	type Connection,
	type Edge,
	type EdgeChange,
	type Node,
	type NodeChange,
	type XYPosition,
} from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { type BoxKind, type PatchConnection, parseBox } from "../utils/patcher";

export type ObjectData = {
	text: string;
	/** MIDI port id; "" for an input: every device. */
	device?: string;
	/** Just placed: the text is being typed. */
	editing?: boolean;
	/** An object (default) or a message box. */
	box?: BoxKind;
};

export type ObjectNode = Node<ObjectData, "object">;

/** Handle ids: "in-0", "out-2". */
export const inletId = (i: number) => `in-${i}`;
export const outletId = (i: number) => `out-${i}`;
const portIndex = (handle: string | null | undefined) =>
	Number(handle?.split("-")[1] ?? 0);

export const toConnection = (edge: Edge): PatchConnection => ({
	source: edge.source,
	outlet: portIndex(edge.sourceHandle),
	target: edge.target,
	inlet: portIndex(edge.targetHandle),
});

interface PatcherState {
	nodes: ObjectNode[];
	edges: Edge[];
	onNodesChange: (changes: NodeChange<ObjectNode>[]) => void;
	onEdgesChange: (changes: EdgeChange[]) => void;
	onConnect: (connection: Connection) => void;
	/** Places a new object; with no text, it opens for typing. */
	addObject: (position: XYPosition, text?: string, box?: BoxKind) => void;
	/** Changes an object's text; connections to ports it lost go. */
	setText: (id: string, text: string) => void;
	setDevice: (id: string, device: string) => void;
	removeObject: (id: string) => void;
	clear: () => void;
}

export const usePatcherStore = create<PatcherState>()(
	devtools(
		persist(
			(set) => ({
				nodes: [],
				edges: [],
				onNodesChange: (changes) =>
					set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })),
				onEdgesChange: (changes) =>
					set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),
				onConnect: (connection) =>
					set((s) => ({ edges: addEdge(connection, s.edges) })),
				addObject: (position, text = "", box = "object") =>
					set((s) => ({
						nodes: [
							...s.nodes.map((n) => ({ ...n, selected: false })),
							{
								id: uuidv4(),
								type: "object",
								position,
								selected: true,
								data: { text, device: "", editing: !text, box },
							},
						],
					})),
				setText: (id, text) =>
					set((s) => {
						const spec = parseBox(
							text,
							s.nodes.find((n) => n.id === id)?.data.box,
						);
						return {
							nodes: s.nodes.map((n) =>
								n.id === id
									? { ...n, data: { ...n.data, text, editing: false } }
									: n,
							),
							edges: s.edges.filter((e) => {
								const c = toConnection(e);
								return (
									(e.source !== id || c.outlet < spec.outlets) &&
									(e.target !== id || c.inlet < spec.inlets)
								);
							}),
						};
					}),
				setDevice: (id, device) =>
					set((s) => ({
						nodes: s.nodes.map((n) =>
							n.id === id ? { ...n, data: { ...n.data, device } } : n,
						),
					})),
				removeObject: (id) =>
					set((s) => ({
						nodes: s.nodes.filter((n) => n.id !== id),
						edges: s.edges.filter((e) => e.source !== id && e.target !== id),
					})),
				clear: () => set({ nodes: [], edges: [] }),
			}),
			{
				name: "enomik-patcher",
				version: 1,
				// Only the patch itself, not selection or what's being typed.
				partialize: (s) => ({
					nodes: s.nodes.map(({ id, type, position, data }) => ({
						id,
						type,
						position,
						data: { text: data.text, device: data.device, box: data.box },
					})),
					edges: s.edges.map(
						({ id, source, sourceHandle, target, targetHandle }) => ({
							id,
							source,
							sourceHandle,
							target,
							targetHandle,
						}),
					),
				}),
			},
		),
		{ name: "patcher" },
	),
);
