import { useMemo, useState } from "react";
import { deviceInputId, useMIDIStore } from "../../store/midi";
import type { Port } from "../../utils/tester";

export type Role = "client" | "dongle";
export const AUTO = "auto";
export const NONE = "none";

const NEEDLES: Record<Role, string[]> = {
	client: ["client", "enomik"],
	dongle: ["dongle", "enomik"],
};

const connected = (port: MIDIPort) => port.state !== "disconnected";

function resolve(
	choice: string,
	role: Role,
	inputs: MIDIInput[],
	outputs: MIDIOutput[],
	exclude: Port | null,
): Port | null {
	if (choice === NONE) return null;
	const output =
		choice === AUTO
			? NEEDLES[role]
					.map((needle) =>
						outputs.find(
							(o) =>
								connected(o) &&
								o.id !== exclude?.output.id &&
								(o.name ?? "").toLowerCase().includes(needle),
						),
					)
					.find(Boolean)
			: outputs.find((o) => o.id === choice);
	if (!output) return null;
	// deviceInputId gives up when board names overlap (e.g. "enomik" and
	// "enomik client"); then take the one input with the exact same name.
	const sameName = inputs.filter(
		(i) => connected(i) && i.id !== exclude?.input.id && i.name === output.name,
	);
	const inputId =
		deviceInputId(output.id) ??
		(sameName.length === 1 ? sameName[0].id : undefined);
	const input = inputs.find((i) => i.id === inputId);
	return input ? { input, output } : null;
}

const portKey = (port: Port | null) =>
	port ? `${port.output.id}/${port.input.id}` : "";

/**
 * Same object while the port IDs stay the same: the port list changes on every
 * plug event, which must not restart listeners or resend pin configs.
 */
function useStablePort(port: Port | null) {
	const [stable, setStable] = useState(port);
	if (portKey(stable) === portKey(port)) return stable;
	setStable(port);
	return port;
}

/** Client and dongle ports for the dropdown choices; the dongle never takes the client's. */
export function usePorts(choice: Record<Role, string>) {
	const inputs = useMIDIStore((state) => state.inputs) as MIDIInput[];
	const outputs = useMIDIStore((state) => state.outputs) as MIDIOutput[];
	const resolved = useMemo(() => {
		const client = resolve(choice.client, "client", inputs, outputs, null);
		const dongle = resolve(choice.dongle, "dongle", inputs, outputs, client);
		return { client, dongle };
	}, [choice.client, choice.dongle, inputs, outputs]);
	return {
		client: useStablePort(resolved.client),
		dongle: useStablePort(resolved.dongle),
		outputs,
	};
}
