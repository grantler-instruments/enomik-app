/**
 * Where the firmware files are, under public/firmware/: shared by the
 * uploader and the test that checks the files the release bot commits.
 */

/** A role's binary for a board, as built by the firmware repo's release. */
/**
 * Categories a manifest role can name. Roles without one are the main
 * firmware; the others are grouped under "More firmware" in the uploader,
 * in this order. Each needs a firmwareuploader_category_<name> string.
 */
export const FIRMWARE_CATEGORIES = ["examples"] as const;

export const firmwareFileName = (boardId: string, sketch: string) =>
	`${boardId}_${sketch}_${sketch}.ino.bin`;
