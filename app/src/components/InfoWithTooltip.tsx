import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

export default function InfoWithTooltip({
	text,
	asButton = true,
}: {
	text?: string;
	asButton?: boolean;
}) {
	const icon = <InfoOutlinedIcon fontSize="small" />;

	return (
		<Tooltip title={text || ""} enterTouchDelay={0} arrow>
			{asButton ? (
				<IconButton size="small">{icon}</IconButton>
			) : (
				// Focus shows the tooltip; clicks and keys don't fold the accordion.
				// biome-ignore lint/a11y/useSemanticElements: sits inside accordion headers, which are <button>s
				<span
					role="button"
					tabIndex={0}
					aria-label={text}
					style={{ display: "inline-flex", cursor: "pointer" }}
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					{icon}
				</span>
			)}
		</Tooltip>
	);
}
