import "@xyflow/react/dist/style.css";
import {
	Add as AddIcon,
	Close as CloseIcon,
	DeleteOutline as DeleteIcon,
	FitScreen as FitScreenIcon,
	ZoomIn as ZoomInIcon,
	ZoomOut as ZoomOutIcon,
} from "@mui/icons-material";
import {
	Autocomplete,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	IconButton,
	ListItemText,
	ListSubheader,
	Menu,
	MenuItem,
	Select,
	TextField,
	Tooltip,
	Typography,
	useTheme,
} from "@mui/material";
import {
	Background,
	ControlButton,
	Controls,
	Handle,
	type NodeProps,
	Position,
	ReactFlow,
	ReactFlowProvider,
	useReactFlow,
	useUpdateNodeInternals,
	type XYPosition,
} from "@xyflow/react";
import {
	type CSSProperties,
	createContext,
	type MouseEvent,
	useContext,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { create } from "zustand";
import { useAppStore } from "../store/app";
import { useMIDIStore } from "../store/midi";
import {
	inletId,
	type ObjectNode,
	outletId,
	toConnection,
	usePatcherStore,
} from "../store/patcher";
import {
	BANG,
	type BoxKind,
	type Message,
	Patch,
	type PatchState,
	parseBox,
} from "../utils/patcher";
import CollapsibleSection from "./common/CollapsibleSection";
import InitMidi from "./InitMidi";
import PageLayout from "./layout/PageLayout";
import SectionHeader from "./SectionHeader";

/** What number boxes show, by object id. Not kept: it's live. */
const useDisplay = create<{
	values: Record<string, number>;
	/** How often each bng was banged: a change lights it up. */
	flashes: Record<string, number>;
}>(() => ({
	values: {},
	flashes: {},
}));

/** The running patch, for objects people click (bng, tgl). */
const PatchContext = createContext<Patch | null>(null);

/** How long a bng lights up, in ms. */
const FLASH_MS = 150;

/** Size of a bng or tgl, in px. */
const GUI_SIZE = 32;

/** Whether a bng or message box lit up just now. */
const useFlash = (id: string) => {
	const flashes = useDisplay((s) => s.flashes[id]);
	const [lit, setLit] = useState(false);
	useEffect(() => {
		if (!flashes) return;
		setLit(true);
		const timer = setTimeout(() => setLit(false), FLASH_MS);
		return () => clearTimeout(timer);
	}, [flashes]);
	return lit;
};

/** A message box's flag shape: a notch on the right. */
const FLAG = (notch: number) =>
	`polygon(0 0, 100% 0, calc(100% - ${notch}px) ${notch}px, calc(100% - ${notch}px) calc(100% - ${notch}px), 100% 100%, 0 100%)`;

/** bng: a circle that lights up when banged; click to bang. */
const Bang = ({ id }: { id: string }) => {
	const { t } = useTranslation();
	const patch = useContext(PatchContext);
	const lit = useFlash(id);
	return (
		<Box
			component="button"
			type="button"
			className="nodrag"
			aria-label={t("patcher_port_bang")}
			onClick={() => patch?.inlet(id, 0, BANG)}
			onDoubleClick={(e) => e.stopPropagation()}
			sx={{
				display: "block",
				mx: "auto",
				width: GUI_SIZE,
				height: GUI_SIZE,
				p: 0,
				borderRadius: "50%",
				border: 2,
				borderColor: "text.primary",
				bgcolor: lit ? "text.primary" : "transparent",
				cursor: "pointer",
				transition: lit ? "none" : "background-color 120ms",
			}}
		/>
	);
};

/** tgl: a box that's on (crossed) or off; click to flip. */
const Toggle = ({ id }: { id: string }) => {
	const { t } = useTranslation();
	const patch = useContext(PatchContext);
	const on = !!useDisplay((s) => s.values[id]);
	return (
		<Box
			component="button"
			type="button"
			className="nodrag"
			aria-label={t("patcher_port_toggle")}
			aria-pressed={on}
			onClick={() => patch?.inlet(id, 0, BANG)}
			onDoubleClick={(e) => e.stopPropagation()}
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				mx: "auto",
				width: GUI_SIZE,
				height: GUI_SIZE,
				p: 0,
				border: 2,
				borderColor: "text.primary",
				bgcolor: "transparent",
				color: "text.primary",
				cursor: "pointer",
			}}
		>
			{on && <CloseIcon />}
		</Box>
	);
};

/** Lines the console keeps; oldest go first. */
const CONSOLE_MAX_LINES = 500;

/** What print objects printed. Not kept: it's live. */
const useConsole = create<{ lines: { id: number; text: string }[] }>(() => ({
	lines: [],
}));

let nextLine = 0;
let pending: { id: number; text: string }[] = [];
let flush: number | null = null;

/** Adds a console line; lines arriving together render once per frame. */
const log = (text: string) => {
	pending.push({ id: nextLine++, text });
	if (flush !== null) return;
	flush = requestAnimationFrame(() => {
		flush = null;
		const added = pending;
		pending = [];
		useConsole.setState((s) => ({
			lines: [...s.lines, ...added].slice(-CONSOLE_MAX_LINES),
		}));
	});
};

const formatNumber = (value: number) => String(Math.round(value * 1000) / 1000);

const formatMessage = (message: Message) =>
	message === BANG
		? "bang"
		: Array.isArray(message)
			? message.map(formatNumber).join(" ")
			: formatNumber(message);

/** Beside the canvas, as high as it; below it on narrow screens. */
const PatchConsole = ({ height }: { height: number | string }) => {
	const { t } = useTranslation();
	const lines = useConsole((s) => s.lines);
	const box = useRef<HTMLDivElement>(null);

	// Follow new lines, unless scrolled up to read older ones.
	const atBottom = useRef(true);
	// biome-ignore lint/correctness/useExhaustiveDependencies: scrolls on new lines
	useEffect(() => {
		const el = box.current;
		if (el && atBottom.current) el.scrollTop = el.scrollHeight;
	}, [lines]);

	return (
		<Box
			sx={{
				width: { xs: "100%", md: 300 },
				flexShrink: 0,
				height: { md: height },
				minHeight: { md: 400 },
				display: "flex",
				flexDirection: "column",
			}}
		>
			<Box display="flex" alignItems="center" mb={0.5}>
				<Typography variant="subtitle2" component="h3" flex={1}>
					{t("patcher_console")}
				</Typography>
				<Tooltip title={t("patcher_console_clear")}>
					<span>
						<IconButton
							size="small"
							aria-label={t("patcher_console_clear")}
							onClick={() => useConsole.setState({ lines: [] })}
							disabled={lines.length === 0}
						>
							<DeleteIcon fontSize="small" />
						</IconButton>
					</span>
				</Tooltip>
			</Box>
			<Box
				ref={box}
				role="log"
				aria-label={t("patcher_console")}
				tabIndex={0}
				onScroll={(e) => {
					const el = e.currentTarget;
					atBottom.current =
						el.scrollHeight - el.scrollTop - el.clientHeight < 8;
				}}
				sx={{
					height: { xs: 160, md: "auto" },
					flex: { md: 1 },
					minHeight: 0,
					overflow: "auto",
					px: 1,
					py: 0.5,
					fontFamily: "monospace",
					fontSize: 13,
					border: 1,
					borderColor: "divider",
					borderRadius: 1,
					bgcolor: "action.hover",
				}}
			>
				{lines.length === 0 ? (
					<Typography variant="body2" color="text.secondary">
						{t("patcher_console_empty")}
					</Typography>
				) : (
					lines.map((line) => <div key={line.id}>{line.text}</div>)
				)}
			</Box>
		</Box>
	);
};

const MENU = [
	{ group: "patcher_group_in", names: ["notein", "ctlin", "midiin"] },
	{ group: "patcher_group_out", names: ["noteout", "ctlout", "midiout"] },
	{
		group: "patcher_group_math",
		names: ["+", "-", "*", "/", "%", "min", "max", "scale", "clip"],
	},
	{ group: "patcher_group_compare", names: ["==", "!=", ">", "<", ">=", "<="] },
	{ group: "patcher_group_flow", names: ["trigger", "spigot", "moses"] },
	{ group: "patcher_group_gui", names: ["message", "bng", "tgl"] },
	{ group: "patcher_group_debug", names: ["number", "print"] },
];

/** Object reference: name with arguments, i18n key of the description. */
const REFERENCE = [
	["notein [channel]", "patcher_ref_notein"],
	["ctlin [controller] [channel]", "patcher_ref_ctlin"],
	["midiin", "patcher_ref_midiin"],
	["noteout [channel]", "patcher_ref_noteout"],
	["ctlout [controller] [channel]", "patcher_ref_ctlout"],
	["midiout", "patcher_ref_midiout"],
	["+ - * / % min max [n]", "patcher_ref_math"],
	["== != > < >= <= [n]", "patcher_ref_compare"],
	["scale in-low in-high out-low out-high", "patcher_ref_scale"],
	["clip low high", "patcher_ref_clip"],
	["number", "patcher_ref_number"],
	["print [label]", "patcher_ref_print"],
	["trigger / t [f b a …]", "patcher_ref_trigger"],
	["spigot [open]", "patcher_ref_spigot"],
	["moses [split]", "patcher_ref_moses"],
	["bng", "patcher_ref_bng"],
	["tgl", "patcher_ref_tgl"],
	["message: 60 100, $1, bang", "patcher_ref_message"],
] as const;

/** Spreads ports over the box's width. */
const portLeft = (i: number, count: number) => `${((i + 0.5) / count) * 100}%`;

/** Room per port, so wide objects keep their ports apart. */
const PORT_SPACING = 28;

/** Accent colour by what an object does. */
const colorOf = (kind: string, midi: "in" | "out" | null) =>
	!kind
		? "error"
		: midi === "in"
			? "success"
			: midi === "out"
				? "info"
				: kind === "number" || kind === "print"
					? "warning"
					: "primary";

const DeviceSelect = ({
	id,
	direction,
	device,
}: {
	id: string;
	direction: "in" | "out";
	device: string;
}) => {
	const { t } = useTranslation();
	const ports = useMIDIStore((s) =>
		direction === "in" ? s.inputs : s.outputs,
	) as MIDIPort[];
	const setDevice = usePatcherStore((s) => s.setDevice);
	const missing = !!device && !ports.some((p) => p.id === device);
	return (
		<Select
			variant="standard"
			size="small"
			className="nodrag nowheel"
			value={device}
			displayEmpty
			onChange={(e) => setDevice(id, e.target.value)}
			inputProps={{ "aria-label": t("patcher_device") }}
			sx={{ fontSize: 12, mt: 0.5, maxWidth: 200, display: "flex" }}
		>
			<MenuItem value="" sx={{ fontSize: 12 }}>
				{direction === "in" ? t("patcher_all_devices") : t("patcher_no_device")}
			</MenuItem>
			{ports.map((p) => (
				<MenuItem key={p.id} value={p.id} sx={{ fontSize: 12 }}>
					{p.name}
				</MenuItem>
			))}
			{missing && (
				<MenuItem value={device} sx={{ fontSize: 12 }}>
					{t("patcher_missing_device")}
				</MenuItem>
			)}
		</Select>
	);
};

/** An object box: its text, its inlets on top and outlets below. */
const ObjectBox = ({ id, data, selected }: NodeProps<ObjectNode>) => {
	const { t } = useTranslation();
	const setText = usePatcherStore((s) => s.setText);
	const removeObject = usePatcherStore((s) => s.removeObject);
	const [editing, setEditing] = useState(!!data.editing);
	const [draft, setDraft] = useState(data.text);
	const input = useRef<HTMLInputElement>(null);
	// React Flow shows a node only once it's measured, a few frames after
	// it's placed: keep trying until the field takes the focus.
	useEffect(() => {
		if (!editing) return;
		let frame = 0;
		let tries = 0;
		const focus = () => {
			const el = input.current;
			el?.focus();
			if (el && document.activeElement === el) el.select();
			else if (tries++ < 30) frame = requestAnimationFrame(focus);
		};
		focus();
		return () => cancelAnimationFrame(frame);
	}, [editing]);
	const value = useDisplay((s) => s.values[id]);
	const message = data.box === "message";
	const spec = parseBox(data.text, data.box);
	const patch = useContext(PatchContext);
	const lit = useFlash(id);
	const gui = !editing && (spec.kind === "bng" || spec.kind === "tgl");
	const unknown = !spec.kind && !editing;
	// React Flow reads handle positions when a node resizes; ports can change
	// without that (e.g. a message box keeps its size): tell it.
	const updateNodeInternals = useUpdateNodeInternals();
	// biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the ports change
	useEffect(
		() => updateNodeInternals(id),
		[id, spec.inlets, spec.outlets, editing, updateNodeInternals],
	);
	const theme = useTheme();
	const color =
		theme.palette[colorOf(editing ? "?" : spec.kind, spec.midi)].main;
	/** A message box's outline. */
	const outline = selected
		? color
		: unknown
			? theme.palette.error.main
			: theme.palette.text.secondary;
	/** The hot inlet is in the primary colour, every other port black (white in dark mode). */
	const portStyle = (hot: boolean) =>
		({
			"--port": hot ? theme.palette.primary.main : theme.palette.text.primary,
			width: 14,
			height: 14,
			borderRadius: "50%",
			background: theme.palette.background.paper,
			border: "2px solid var(--port)",
		}) as CSSProperties;

	const commit = () => {
		setEditing(false);
		const text = draft.trim();
		if (!text) {
			if (!data.text) removeObject(id);
			else setDraft(data.text);
			return;
		}
		setText(id, text);
	};
	const cancel = () => {
		setEditing(false);
		if (!data.text) removeObject(id);
		else setDraft(data.text);
	};

	return (
		<Box
			onDoubleClick={(e) => {
				e.stopPropagation();
				setDraft(data.text);
				setEditing(true);
			}}
			// A message box sends its content when clicked (not after a drag).
			onClick={
				message && !editing && !unknown
					? () => patch?.inlet(id, 0, BANG)
					: undefined
			}
			sx={{
				position: "relative",
				minWidth: Math.max(
					gui ? GUI_SIZE + 24 : message ? 56 : 96,
					Math.max(spec.inlets, spec.outlets) * PORT_SPACING,
				),
				px: 1.5,
				pr: message ? 2.5 : 1.5,
				py: 1,
				fontSize: 14,
				fontWeight: 500,
				textAlign: "center",
				color: "text.primary",
				borderRadius: 0,
				cursor: message && !editing ? "pointer" : undefined,
				...(message
					? {
							// Two flags: the outline, and the fill 1px inside it.
							isolation: "isolate",
							"&::before, &::after": {
								content: '""',
								position: "absolute",
								zIndex: -1,
							},
							"&::before": {
								inset: 0,
								bgcolor: outline,
								clipPath: FLAG(8),
							},
							"&::after": {
								inset: selected ? 2 : 1,
								bgcolor: lit ? "action.selected" : "background.paper",
								clipPath: FLAG(7.5),
								transition: lit ? "none" : "background-color 200ms",
							},
						}
					: {
							bgcolor: "background.paper",
							border: 1,
							borderStyle: unknown ? "dashed" : "solid",
							borderColor: unknown ? color : "divider",
							boxShadow: selected ? `0 0 0 2px ${color}` : 2,
						}),
				transition: "box-shadow 120ms",
				"& .react-flow__handle": { transition: "background 120ms" },
				"& .react-flow__handle:hover, & .react-flow__handle.connectingto": {
					background: "var(--port) !important",
				},
			}}
			title={unknown ? t("patcher_unknown") : undefined}
		>
			{Array.from({ length: spec.inlets }, (_, i) => (
				<Tooltip
					// biome-ignore lint/suspicious/noArrayIndexKey: ports are by index
					key={i}
					placement="top"
					disableInteractive
					title={
						<>
							<Box fontWeight="bold">
								{t(`patcher_port_${spec.inletNames[i]}`)}
							</Box>
							{t(i === 0 ? "patcher_port_hot" : "patcher_port_cold")}
						</>
					}
				>
					<Handle
						id={inletId(i)}
						type="target"
						position={Position.Top}
						style={{ ...portStyle(i === 0), left: portLeft(i, spec.inlets) }}
					/>
				</Tooltip>
			))}
			{editing ? (
				<input
					ref={input}
					className="nodrag"
					aria-label={t(
						message ? "patcher_message_text" : "patcher_object_text",
					)}
					placeholder={t(
						message
							? "patcher_message_placeholder"
							: "patcher_object_placeholder",
					)}
					value={draft}
					size={Math.max(8, draft.length + 1)}
					onChange={(e) => setDraft(e.target.value)}
					onBlur={commit}
					onKeyDown={(e) => {
						if (e.key === "Enter") commit();
						else if (e.key === "Escape") cancel();
					}}
					style={{
						font: "inherit",
						color: "inherit",
						textAlign: "center",
						background: "transparent",
						border: "none",
						outline: "none",
						padding: 0,
					}}
				/>
			) : spec.kind === "bng" ? (
				<Bang id={id} />
			) : spec.kind === "tgl" ? (
				<Toggle id={id} />
			) : spec.kind === "number" ? (
				<Box component="span" fontWeight="bold" fontSize={18}>
					{value === undefined ? "0" : formatNumber(value)}
				</Box>
			) : (
				<span>{data.text}</span>
			)}
			{spec.midi && !editing && (
				<DeviceSelect
					id={id}
					direction={spec.midi}
					device={data.device ?? ""}
				/>
			)}
			{Array.from({ length: spec.outlets }, (_, i) => (
				<Tooltip
					// biome-ignore lint/suspicious/noArrayIndexKey: ports are by index
					key={i}
					placement="bottom"
					disableInteractive
					title={t(`patcher_port_${spec.outletNames[i]}`)}
				>
					<Handle
						id={outletId(i)}
						type="source"
						position={Position.Bottom}
						style={{ ...portStyle(false), left: portLeft(i, spec.outlets) }}
					/>
				</Tooltip>
			))}
		</Box>
	);
};

const NODE_TYPES = { object: ObjectBox };

/** Runs the patch: MIDI in, through the objects, MIDI out. */
const usePatch = () => {
	const nodes = usePatcherStore((s) => s.nodes);
	const edges = usePatcherStore((s) => s.edges);
	const inputs = useMIDIStore((s) => s.inputs) as MIDIInput[];
	const state = useRef<PatchState>(new Map());

	// Moving objects around doesn't change the patch.
	const objects = nodes.map(({ id, data }) => ({
		id,
		text: data.text,
		device: data.device,
		box: data.box,
	}));
	const connections = edges.map(toConnection);
	const key = JSON.stringify([objects, connections]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: rebuilt by key
	const patch = useMemo(() => {
		const patch = new Patch(
			objects,
			connections,
			{
				send: (device, bytes) => {
					const output = (useMIDIStore.getState().outputs as MIDIOutput[]).find(
						(o) => o.id === device,
					);
					if (!output || output.state === "disconnected") return;
					try {
						output.send(bytes);
					} catch (e) {
						console.warn("Patcher: MIDI send failed", e);
					}
				},
				print: (label, message) => log(`${label}: ${formatMessage(message)}`),
				flash: (id) =>
					useDisplay.setState((s) => ({
						flashes: { ...s.flashes, [id]: (s.flashes[id] ?? 0) + 1 },
					})),
				display: (id, value) =>
					useDisplay.setState((s) => ({
						values: { ...s.values, [id]: value },
					})),
			},
			state.current,
		);
		state.current = patch.state;
		return patch;
	}, [key]);

	useEffect(() => {
		const listeners = inputs.map((input) => {
			const listener = (event: MIDIMessageEvent) => {
				if (event.data) patch.receive(input.id, event.data);
			};
			input.addEventListener("midimessage", listener);
			return () => input.removeEventListener("midimessage", listener);
		});
		return () => {
			for (const remove of listeners) remove();
		};
	}, [inputs, patch]);

	return patch;
};

/** Ctrl+1, or Cmd+1 on a Mac. By key position, so it works on any layout. */
const isPlaceShortcut = (e: KeyboardEvent) => isShortcut(e, "Digit1");

/** Ctrl+K, or Cmd+K on a Mac: search objects by name. */
const isSearchShortcut = (e: KeyboardEvent) => isShortcut(e, "KeyK");

/** Ctrl+2, or Cmd+2 on a Mac: a new message box, like Pure Data. */
const isMessageShortcut = (e: KeyboardEvent) => isShortcut(e, "Digit2");

/**
 * Places what was picked or typed: "message" is an empty message box,
 * "msg 60 100" one with that content, anything else an object.
 */
const placeText = (
	addObject: (position: XYPosition, text?: string, box?: BoxKind) => void,
	position: XYPosition,
	text: string,
) => {
	if (text === "message" || text === "msg") addObject(position, "", "message");
	else if (/^msg\s/.test(text))
		addObject(position, text.slice(4).trim(), "message");
	else addObject(position, text);
};

const isShortcut = (e: KeyboardEvent, code: string) =>
	e.code === code && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey;

/** Typing into a field: shortcuts stay out of the way. */
const isTyping = (target: EventTarget | null) =>
	target instanceof HTMLElement &&
	(target.isContentEditable ||
		/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

const IS_MAC =
	typeof navigator !== "undefined" &&
	/Mac|iPhone|iPad/.test(navigator.userAgent);

/** How the shortcuts read on this system. */
const PLACE_SHORTCUT = IS_MAC ? "⌘1" : "Ctrl+1";
const SEARCH_SHORTCUT = IS_MAC ? "⌘K" : "Ctrl+K";
const MESSAGE_SHORTCUT = IS_MAC ? "⌘2" : "Ctrl+2";

type SearchOption = { name: string; group: string };

const SEARCH_OPTIONS: SearchOption[] = MENU.flatMap(({ group, names }) =>
	names.map((name) => ({ name, group })),
);

/**
 * Objects whose name starts with what's typed. Once arguments follow (a
 * space), nothing matches: Enter places the text as typed, e.g. "+ 5".
 */
const filterSearch = (
	options: SearchOption[],
	{ inputValue }: { inputValue: string },
) => {
	const query = inputValue.trimStart();
	if (!query) return options;
	if (/\s/.test(query)) return [];
	return options.filter((o) => o.name.startsWith(query));
};

/** Ctrl/Cmd+K: type an object's name (and arguments), Enter places it. */
const ObjectSearch = ({
	open,
	onClose,
	onPlace,
}: {
	open: boolean;
	onClose: () => void;
	onPlace: (text: string) => void;
}) => {
	const { t } = useTranslation();
	const place = (text: string) => {
		const trimmed = text.trim();
		if (!trimmed) return;
		onPlace(trimmed);
		onClose();
	};
	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullWidth
			maxWidth="xs"
			sx={{ "& .MuiDialog-container": { alignItems: "flex-start" } }}
			slotProps={{ paper: { sx: { mt: "15vh" } } }}
		>
			<Autocomplete<SearchOption, false, false, true>
				freeSolo
				autoHighlight
				openOnFocus
				options={SEARCH_OPTIONS}
				filterOptions={filterSearch}
				groupBy={(o) => t(o.group)}
				getOptionLabel={(o) => (typeof o === "string" ? o : o.name)}
				onChange={(_, value) => {
					if (value) place(typeof value === "string" ? value : value.name);
				}}
				renderOption={({ key, ...props }, o) => (
					<li key={key} {...props} style={{ fontFamily: "monospace" }}>
						{o.name}
					</li>
				)}
				renderInput={(params) => (
					<TextField
						{...params}
						autoFocus
						label={t("patcher_search_label")}
						placeholder={t("patcher_object_placeholder")}
						sx={{ m: 2, width: "calc(100% - 32px)" }}
					/>
				)}
			/>
		</Dialog>
	);
};

/** A shortcut, right-aligned in a menu item. */
const Shortcut = ({ keys }: { keys: string }) => (
	<Typography variant="body2" color="text.secondary" ml={3}>
		{keys}
	</Typography>
);

const Canvas = ({ height }: { height: number | string }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const darkMode = useAppStore((s) => s.darkMode);
	const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();
	const nodes = usePatcherStore((s) => s.nodes);
	const edges = usePatcherStore((s) => s.edges);
	const onNodesChange = usePatcherStore((s) => s.onNodesChange);
	const onEdgesChange = usePatcherStore((s) => s.onEdgesChange);
	const onConnect = usePatcherStore((s) => s.onConnect);
	const addObject = usePatcherStore((s) => s.addObject);
	const clear = usePatcherStore((s) => s.clear);
	const [confirmClear, setConfirmClear] = useState(false);
	const clearTitleId = useId();
	const clearTextId = useId();

	/** Where the pointer last was over the canvas, in screen coordinates. */
	const pointer = useRef<{ x: number; y: number } | null>(null);
	const box = useRef<HTMLElement | null>(null);

	/** Where the search's object goes: where the pointer was when it opened. */
	const [searchAt, setSearchAt] = useState<XYPosition | null>(null);

	/** Right-click on empty canvas: a menu of objects, placed where clicked. */
	const [menuAt, setMenuAt] = useState<{ x: number; y: number } | null>(null);
	const placeFromMenu = (text: string) => {
		if (!menuAt) return;
		setMenuAt(null);
		placeText(addObject, screenToFlowPosition(menuAt), text);
	};

	// Ctrl/Cmd+1 and +2, like Pure Data: a new object or message box at the
	// pointer (or in the middle). Ctrl/Cmd+K: search objects, placed there too.
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			const placing = isPlaceShortcut(e);
			const messaging = isMessageShortcut(e);
			if (
				(!placing && !messaging && !isSearchShortcut(e)) ||
				isTyping(e.target)
			)
				return;
			e.preventDefault();
			const rect = box.current?.getBoundingClientRect();
			const at =
				pointer.current ??
				(rect && {
					x: rect.left + rect.width / 2,
					y: rect.top + rect.height / 2,
				});
			if (!at) return;
			if (placing) addObject(screenToFlowPosition(at));
			else if (messaging) addObject(screenToFlowPosition(at), "", "message");
			else setSearchAt(screenToFlowPosition(at));
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [addObject, screenToFlowPosition]);

	/** Double-click on empty canvas: a new object, ready to type. */
	const onDoubleClick = (e: MouseEvent) => {
		if (!(e.target as Element).classList.contains("react-flow__pane")) return;
		addObject(screenToFlowPosition({ x: e.clientX, y: e.clientY }));
	};

	return (
		<Box
			ref={box}
			onPointerMove={(e) => {
				pointer.current = { x: e.clientX, y: e.clientY };
			}}
			onPointerLeave={() => {
				pointer.current = null;
			}}
			role="region"
			aria-label={t("patcher_canvas")}
			sx={{
				height,
				minHeight: 400,
				border: 1,
				borderColor: "divider",
				borderRadius: 1,
				overflow: "hidden",
				// In CSS, not as an inline edge style, so React Flow's selected
				// state can still show: a selected connection turns primary.
				"& .react-flow__edge-path": {
					stroke: theme.palette.text.secondary,
					strokeWidth: 2,
				},
				"& .react-flow__edge.selected .react-flow__edge-path, & .react-flow__edge:focus-visible .react-flow__edge-path":
					{
						stroke: theme.palette.primary.main,
						strokeWidth: 3,
					},
			}}
		>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={NODE_TYPES}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onDoubleClick={onDoubleClick}
				onPaneContextMenu={(e) => {
					e.preventDefault();
					setMenuAt({ x: e.clientX, y: e.clientY });
				}}
				zoomOnDoubleClick={false}
				deleteKeyCode={["Backspace", "Delete"]}
				connectionLineStyle={{
					stroke: theme.palette.primary.main,
					strokeWidth: 2,
				}}
				colorMode={darkMode ? "dark" : "light"}
				fitView
				fitViewOptions={{ maxZoom: 1.2 }}
				proOptions={{ hideAttribution: true }}
			>
				<Background gap={16} />
				{/* Own buttons, so every control has the same (MUI) icons. */}
				<Controls showInteractive={false} showZoom={false} showFitView={false}>
					<ControlButton
						title={t("patcher_zoom_in")}
						aria-label={t("patcher_zoom_in")}
						onClick={() => zoomIn()}
					>
						<ZoomInIcon />
					</ControlButton>
					<ControlButton
						title={t("patcher_zoom_out")}
						aria-label={t("patcher_zoom_out")}
						onClick={() => zoomOut()}
					>
						<ZoomOutIcon />
					</ControlButton>
					<ControlButton
						title={t("patcher_fit_view")}
						aria-label={t("patcher_fit_view")}
						onClick={() => fitView({ maxZoom: 1.2 })}
					>
						<FitScreenIcon />
					</ControlButton>
					<ControlButton
						title={`${t("patcher_menu_object")} (${PLACE_SHORTCUT})`}
						aria-label={t("patcher_menu_object")}
						onClick={() => {
							const rect = box.current?.getBoundingClientRect();
							if (!rect) return;
							addObject(
								screenToFlowPosition({
									x: rect.left + rect.width / 2,
									y: rect.top + rect.height / 2,
								}),
							);
						}}
					>
						<AddIcon />
					</ControlButton>
					<ControlButton
						title={t("patcher_clear")}
						aria-label={t("patcher_clear")}
						disabled={nodes.length === 0}
						onClick={() => setConfirmClear(true)}
					>
						<DeleteIcon />
					</ControlButton>
				</Controls>
			</ReactFlow>
			<Dialog
				open={confirmClear}
				onClose={() => setConfirmClear(false)}
				aria-labelledby={clearTitleId}
				aria-describedby={clearTextId}
			>
				<DialogTitle id={clearTitleId}>
					{t("patcher_clear_confirm")}
				</DialogTitle>
				<DialogContent>
					<DialogContentText id={clearTextId}>
						{t("patcher_clear_undo")}
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setConfirmClear(false)}>
						{t("patcher_cancel")}
					</Button>
					<Button
						variant="contained"
						color="error"
						onClick={() => {
							clear();
							setConfirmClear(false);
						}}
					>
						{t("patcher_clear")}
					</Button>
				</DialogActions>
			</Dialog>
			<Menu
				open={!!menuAt}
				onClose={() => setMenuAt(null)}
				anchorReference="anchorPosition"
				anchorPosition={menuAt ? { top: menuAt.y, left: menuAt.x } : undefined}
				slotProps={{ paper: { sx: { maxHeight: 420 } } }}
			>
				<MenuItem onClick={() => placeFromMenu("")}>
					<ListItemText>{t("patcher_menu_object")}</ListItemText>
					<Shortcut keys={PLACE_SHORTCUT} />
				</MenuItem>
				<MenuItem onClick={() => placeFromMenu("message")}>
					<ListItemText>{t("patcher_menu_message")}</ListItemText>
					<Shortcut keys={MESSAGE_SHORTCUT} />
				</MenuItem>
				<MenuItem
					onClick={() => {
						if (menuAt) setSearchAt(screenToFlowPosition(menuAt));
						setMenuAt(null);
					}}
				>
					<ListItemText>{t("patcher_menu_search")}</ListItemText>
					<Shortcut keys={SEARCH_SHORTCUT} />
				</MenuItem>
				{MENU.flatMap(({ group, names }) => [
					<Divider key={`${group}-divider`} />,
					<ListSubheader key={group} sx={{ lineHeight: "32px" }}>
						{t(group)}
					</ListSubheader>,
					...names.map((name) => (
						<MenuItem
							key={name}
							dense
							onClick={() => placeFromMenu(name)}
							sx={{ fontFamily: "monospace" }}
						>
							{name}
						</MenuItem>
					)),
				])}
			</Menu>
			<ObjectSearch
				open={!!searchAt}
				onClose={() => setSearchAt(null)}
				onPlace={(text) => searchAt && placeText(addObject, searchAt, text)}
			/>
		</Box>
	);
};

const Reference = () => {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	return (
		<CollapsibleSection
			expanded={open}
			onChange={setOpen}
			sx={{ my: 2 }}
			title={<SectionHeader component="span" title={t("patcher_reference")} />}
		>
			<Box
				component="dl"
				display="grid"
				gridTemplateColumns={{ xs: "1fr", sm: "auto 1fr" }}
				columnGap={3}
				rowGap={1}
				m={0}
			>
				{REFERENCE.map(([syntax, key]) => (
					<Box key={key} display="contents">
						<Typography component="dt" fontFamily="monospace" fontSize={14}>
							{syntax}
						</Typography>
						<Typography component="dd" variant="body2" m={0}>
							{t(key)}
						</Typography>
					</Box>
				))}
			</Box>
		</CollapsibleSection>
	);
};

/** The canvas with the console on its right. */
const Workspace = ({ height }: { height: number | string }) => (
	<Box
		display="flex"
		flexDirection={{ xs: "column", md: "row" }}
		gap={2}
		alignItems="stretch"
	>
		<Box flex={1} minWidth={0}>
			<Canvas height={height} />
		</Box>
		<PatchConsole height={height} />
	</Box>
);

const PatcherPage = ({ embedded }: { embedded: boolean }) => {
	const { t } = useTranslation();
	const patch = usePatch();

	const toolbar = <InitMidi />;

	if (embedded)
		return (
			<Box>
				<Box mb={1.5}>{toolbar}</Box>
				<PatchContext value={patch}>
					<Workspace height={500} />
				</PatchContext>
				<Reference />
			</Box>
		);

	return (
		<PageLayout
			title={t("patcher")}
			info={t("patcher_info", { keys: PLACE_SHORTCUT })}
			maxWidth={false}
			actions={toolbar}
		>
			<PatchContext value={patch}>
				<Workspace height="calc(100vh - 280px)" />
			</PatchContext>
			<Reference />
		</PageLayout>
	);
};

/**
 * Hidden page (open #/patcher): a minimal Pure Data for MIDI. Objects such
 * as "notein", "+ 12" and "noteout" are typed into boxes and connected;
 * MIDI from the chosen inputs flows through them to the chosen outputs.
 * `embedded`: without page chrome, toolbar inline (used in the Debugger).
 */
const Patcher = ({ embedded = false }: { embedded?: boolean }) => (
	<ReactFlowProvider>
		<PatcherPage embedded={embedded} />
	</ReactFlowProvider>
);

export default Patcher;
