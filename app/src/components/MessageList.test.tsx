// @vitest-environment jsdom
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type MidiMessageWithDirectionAndDevice,
	useMIDIStore,
} from "../store/midi";
import { renderWithProviders } from "../test/render";
import { MIDI_STATUS } from "../utils/midi";
import MessageList, { formatTime } from "./MessageList";

const INPUT = "in-1";
let originalState: ReturnType<typeof useMIDIStore.getState>;
let nextId = 0;

const note = (): MidiMessageWithDirectionAndDevice => ({
	id: `m${nextId++}`,
	type: MIDI_STATUS.NOTE_ON,
	timestamp: 0,
	channel: 1,
	note: 60,
	velocity: 100,
	incoming: true,
	deviceId: INPUT,
});

// Newest first, like the store.
const receive = (count = 1) =>
	act(() =>
		useMIDIStore.setState((state) => ({
			messages: [...Array.from({ length: count }, note), ...state.messages],
		})),
	);

beforeEach(() => {
	originalState = useMIDIStore.getState();
	useMIDIStore.setState({
		initialized: true,
		inputs: [{ id: INPUT, name: "Enomik", state: "connected" }],
		outputs: [],
		messages: [],
	});
});

afterEach(() => useMIDIStore.setState(originalState, true));

describe("MessageList", () => {
	it("asks to start MIDI when it isn't running", () => {
		useMIDIStore.setState({ initialized: false });
		renderWithProviders(<MessageList />);
		expect(screen.getByText(/MIDI isn't started yet/)).toBeTruthy();
	});

	it("waits for messages once MIDI is running", () => {
		renderWithProviders(<MessageList />);
		expect(screen.getByText("Waiting for MIDI messages…")).toBeTruthy();
	});

	it("freezes the list while paused and counts what arrived meanwhile", async () => {
		const user = userEvent.setup();
		renderWithProviders(<MessageList />);
		receive(2);
		expect(screen.getByText("2 messages")).toBeTruthy();

		await user.click(screen.getByRole("button", { name: "Pause" }));
		receive(3);

		expect(screen.getByText("2 messages")).toBeTruthy();
		await user.click(screen.getByRole("button", { name: "Resume · 3 new" }));
		expect(screen.getByText("5 messages")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
	});

	it("clearing also ends a pause", async () => {
		const user = userEvent.setup();
		renderWithProviders(<MessageList />);
		receive(2);
		await user.click(screen.getByRole("button", { name: "Pause" }));
		await user.click(screen.getByRole("button", { name: "Clear" }));

		expect(screen.getByText("Waiting for MIDI messages…")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Pause" })).toHaveProperty(
			"disabled",
			true,
		);
	});

	it("reports how many filter groups hide something", async () => {
		const user = userEvent.setup();
		const onActiveFiltersChange = vi.fn();
		renderWithProviders(
			<MessageList onActiveFiltersChange={onActiveFiltersChange} />,
		);
		expect(onActiveFiltersChange).toHaveBeenLastCalledWith(0);

		await user.click(screen.getByRole("button", { name: /Filter/ }));
		await user.click(screen.getByRole("button", { name: "Note On" }));

		expect(onActiveFiltersChange).toHaveBeenLastCalledWith(1);
	});

	it("shows pitch bend and types the filter has no chip for (tune request)", () => {
		renderWithProviders(<MessageList />);
		act(() =>
			useMIDIStore.setState({
				messages: [
					{ ...note(), type: MIDI_STATUS.PITCH_BEND, pitchBendValue: 9000 },
					{ ...note(), type: MIDI_STATUS.TUNE_REQUEST },
					note(),
				],
			}),
		);
		expect(screen.getByText("3 messages")).toBeTruthy();
	});

	it("shows the raw bytes of every message, channel included", () => {
		renderWithProviders(<MessageList />);
		act(() =>
			useMIDIStore.setState({
				messages: [
					{
						...note(),
						type: MIDI_STATUS.PROGRAM_CHANGE,
						channel: 2,
						controller: 5,
					},
					{
						...note(),
						type: MIDI_STATUS.PITCH_BEND,
						channel: 1,
						pitchBendValue: 8192,
					},
					{ ...note(), channel: 3 },
				],
			}),
		);
		expect(screen.getByText("193, 5")).toBeTruthy();
		expect(screen.getByText("224, 0, 64")).toBeTruthy();
		expect(screen.getByText("146, 60, 100")).toBeTruthy();
	});

	it("shows times to the millisecond", () => {
		const time = new Date(2026, 10, 17, 15, 4, 5, 67).getTime();
		expect(formatTime(time)).toMatch(/15.04.05.067/);
	});

	it("hides clock and active sensing by default and says so", async () => {
		const user = userEvent.setup();
		const onActiveFiltersChange = vi.fn();
		renderWithProviders(
			<MessageList onActiveFiltersChange={onActiveFiltersChange} />,
		);
		act(() =>
			useMIDIStore.setState({
				messages: [
					{ ...note(), type: MIDI_STATUS.TIMING_CLOCK, channel: undefined },
					{ ...note(), type: MIDI_STATUS.TIMING_CLOCK, channel: undefined },
					{ ...note(), type: MIDI_STATUS.ACTIVE_SENSING, channel: undefined },
					note(),
				],
			}),
		);

		expect(
			screen.getByText("1 message · 3 clock/sensing messages hidden"),
		).toBeTruthy();
		// The default selection doesn't count as an active filter.
		expect(onActiveFiltersChange).toHaveBeenLastCalledWith(0);

		await user.click(screen.getByRole("button", { name: /Filter/ }));
		await user.click(screen.getByRole("button", { name: "Clock" }));

		expect(screen.getAllByText("Clock").length).toBeGreaterThan(1);
		expect(screen.getByText("3 of 4 messages shown")).toBeTruthy();
		expect(onActiveFiltersChange).toHaveBeenLastCalledWith(1);
	});
});
