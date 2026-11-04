/**
 * Where the firmware files are, under public/firmware/: shared by the
 * uploader and the test that checks the files the release bot commits.
 */

/** A role's binary for a board, as built by the firmware repo's release. */
export const firmwareFileName = (boardId: string, sketch: string) =>
	`${boardId}_${sketch}_${sketch}.ino.bin`;
