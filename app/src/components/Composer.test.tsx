// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type MidiMessage, useMIDIStore } from "../store/midi";
import { renderWithProviders } from "../test/render";
import { MIDI_STATUS } from "../utils/midi";
import Composer from "./Composer";

const OUTPUT = "out-1";
let sent: { message: MidiMessage; outputId?: string }[];
let originalState: ReturnType<typeof useMIDIStore.getState>;

beforeEach(() => {
	originalState = useMIDIStore.getState();
	sent = [];
	useMIDIStore.setState({
		initialized: true,
		outputs: [{ id: OUTPUT, name: "Enomik", state: "connected" }],
		selectedComposerOutputDevice: OUTPUT,
		composerChannel: 1,
		composerType: MIDI_STATUS.NOTE_ON,
		composerNoteOrCc: 60,
		composerVelocityOrValue: 127,
		composerPitchBendValue: 0,
		composerSysexData: "",
		composerManufacturerId: "",
		sendMessage: (message, outputId) => {
			sent.push({ message, outputId });
			return true;
		},
	});
});

afterEach(() => useMIDIStore.setState(originalState, true));

const renderComposer = (patch: Partial<typeof originalState> = {}) => {
	useMIDIStore.setState(patch);
	return { user: userEvent.setup(), ...renderWithProviders(<Composer />) };
};

const send = (user: ReturnType<typeof userEvent.setup>) =>
	user.click(screen.getByRole("button", { name: "Send MIDI" }));

const field = (name: string) => screen.getByRole("textbox", { name });

describe("Composer send", () => {
	it("sends a note with channel, note and velocity to the selected output", async () => {
		const { user } = renderComposer({
			composerChannel: 3,
			composerNoteOrCc: 64,
			composerVelocityOrValue: 100,
		});

		await send(user);

		expect(sent).toHaveLength(1);
		expect(sent[0].outputId).toBe(OUTPUT);
		expect(sent[0].message).toMatchObject({
			type: MIDI_STATUS.NOTE_ON,
			channel: 3,
			note: 64,
			velocity: 100,
			value: 100,
		});
	});

	it("sends pitch bend offset into 0..16383", async () => {
		const { user } = renderComposer({
			composerType: MIDI_STATUS.PITCH_BEND,
			composerPitchBendValue: -8192,
		});

		await send(user);

		expect(sent[0].message.pitchBendValue).toBe(0);
	});

	it("frames SysEx with F0, manufacturer ID, data bytes and F7", async () => {
		const { user } = renderComposer({
			composerType: MIDI_STATUS.SYSEX_START,
			composerManufacturerId: "7D",
			composerSysexData: "01 02 7f",
		});

		await send(user);

		expect(sent[0].message.data).toEqual([0xf0, 0x7d, 0x01, 0x02, 0x7f, 0xf7]);
	});

	it("leaves out the manufacturer byte when the ID is empty", async () => {
		const { user } = renderComposer({
			composerType: MIDI_STATUS.SYSEX_START,
			composerSysexData: "0A",
		});

		await send(user);

		expect(sent[0].message.data).toEqual([0xf0, 0x0a, 0xf7]);
	});

	it("cannot send without a connected output", () => {
		renderComposer({
			outputs: [{ id: OUTPUT, name: "Enomik", state: "disconnected" }],
		});
		expect(screen.getByRole("button", { name: "Send MIDI" })).toBeDisabled();
	});

	it("sends to a fixed output without showing the chooser", async () => {
		const user = userEvent.setup();
		useMIDIStore.setState({
			outputs: [
				{ id: OUTPUT, name: "Enomik", state: "connected" },
				{ id: "nfc", name: "NFC board", state: "connected" },
			],
		});
		renderWithProviders(<Composer outputId="nfc" />);
		expect(screen.queryByLabelText("MIDI Output")).toBeNull();
		await send(user);
		expect(sent[0].outputId).toBe("nfc");
	});

	it("can be disabled", () => {
		renderWithProviders(<Composer disabled />);
		expect(screen.getByRole("button", { name: "Send MIDI" })).toBeDisabled();
		expect(field("Note")).toBeDisabled();
	});
});

describe("Composer fields", () => {
	it("shows controller and value for Control Change", () => {
		renderComposer({ composerType: MIDI_STATUS.CONTROL_CHANGE });
		expect(field("Controller")).toBeInTheDocument();
		expect(field("Value")).toBeInTheDocument();
	});

	it("shows only the program for Program Change", () => {
		renderComposer({ composerType: MIDI_STATUS.PROGRAM_CHANGE });
		expect(field("Program")).toBeInTheDocument();
		expect(
			screen.queryByRole("textbox", { name: /Value|Velocity/ }),
		).toBeNull();
	});

	it("shows only the value for Channel Pressure", () => {
		renderComposer({ composerType: MIDI_STATUS.CHANNEL_PRESSURE });
		expect(field("Value")).toBeInTheDocument();
		expect(
			screen.queryByRole("textbox", { name: /Note|Controller/ }),
		).toBeNull();
	});

	it("clamps typed values to 0..127 and sends the clamped value", async () => {
		const { user } = renderComposer();

		await user.clear(field("Velocity"));
		await user.type(field("Velocity"), "300");
		await user.tab();

		expect(field("Velocity")).toHaveValue("127");
		expect(useMIDIStore.getState().composerVelocityOrValue).toBe(127);
	});

	it("falls back to the minimum when the field is left empty", async () => {
		const { user } = renderComposer();

		await user.clear(field("Note"));
		await user.tab();

		expect(field("Note")).toHaveValue("0");
		expect(useMIDIStore.getState().composerNoteOrCc).toBe(0);
	});

	it("clamps pitch bend to -8192..8191", async () => {
		const { user } = renderComposer({ composerType: MIDI_STATUS.PITCH_BEND });
		const pitch = field("Pitch Bend (-8192 to +8191)");

		await user.clear(pitch);
		await user.type(pitch, "-9000");
		await user.tab();

		expect(useMIDIStore.getState().composerPitchBendValue).toBe(-8192);
		expect(pitch).toHaveValue("-8192");
	});

	it("shows the SysEx data without spaces in upper case", () => {
		renderComposer({
			composerType: MIDI_STATUS.SYSEX_START,
			composerSysexData: "0a 1b",
		});
		expect(field("Data (hex)")).toHaveValue("0A1B");
	});
});

describe("Composer SysEx validation", () => {
	const sendButton = () => screen.getByRole("button", { name: "Send MIDI" });

	it("keeps only hex digits when typing data", async () => {
		const { user } = renderComposer({ composerType: MIDI_STATUS.SYSEX_START });

		await user.type(field("Data (hex)"), "0x7z1, g2");

		expect(useMIDIStore.getState().composerSysexData).toBe("0712");
		expect(field("Data (hex)")).toHaveValue("0712");
	});

	it("keeps only hex digits in the manufacturer ID, at most three bytes", async () => {
		const { user } = renderComposer({ composerType: MIDI_STATUS.SYSEX_START });

		await user.type(field("Manufacturer ID (*)"), "zz00 21 09 77");

		expect(useMIDIStore.getState().composerManufacturerId).toBe("002109");
	});

	it("sends a three-byte manufacturer ID", async () => {
		const { user } = renderComposer({
			composerType: MIDI_STATUS.SYSEX_START,
			composerManufacturerId: "002109",
			composerSysexData: "01",
		});

		await send(user);

		expect(sent[0].message.data).toEqual([0xf0, 0x00, 0x21, 0x09, 0x01, 0xf7]);
	});

	it("refuses data bytes from 80 up", () => {
		renderComposer({
			composerType: MIDI_STATUS.SYSEX_START,
			composerSysexData: "01FF",
		});

		expect(sendButton()).toBeDisabled();
		expect(field("Data (hex)")).toHaveAttribute("aria-invalid", "true");
		expect(
			screen.getByText("SysEx data bytes must be between 00 and 7F."),
		).toBeInTheDocument();
	});

	it("refuses a half typed byte", () => {
		renderComposer({
			composerType: MIDI_STATUS.SYSEX_START,
			composerSysexData: "012",
		});

		expect(sendButton()).toBeDisabled();
		expect(
			screen.getByText("Each byte needs two hex digits."),
		).toBeInTheDocument();
	});

	it("refuses an invalid manufacturer ID", () => {
		renderComposer({
			composerType: MIDI_STATUS.SYSEX_START,
			composerManufacturerId: "F0",
		});

		expect(sendButton()).toBeDisabled();
		expect(field("Manufacturer ID (*)")).toHaveAttribute(
			"aria-invalid",
			"true",
		);
	});

	it("only checks SysEx fields while SysEx is selected", () => {
		renderComposer({ composerSysexData: "FF" });
		expect(sendButton()).toBeEnabled();
	});
});
