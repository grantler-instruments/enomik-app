/**
 * Keeps loaded samples in IndexedDB (the Grantulator's last one, the MPC
 * pads): localStorage only holds a few MB of strings, too little for most
 * audio files. Stores the encoded file as dropped, which is far smaller than
 * the decoded samples.
 */

const DB_NAME = "grantulator";
const STORE = "samples";
const KEY = "current";

export interface StoredSample {
	name: string;
	data: ArrayBuffer;
}

const open = () =>
	new Promise<IDBDatabase>((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => request.result.createObjectStore(STORE);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});

const transact = async <T>(
	mode: IDBTransactionMode,
	run: (store: IDBObjectStore) => IDBRequest<T>,
) => {
	const db = await open();
	try {
		return await new Promise<T>((resolve, reject) => {
			const request = run(db.transaction(STORE, mode).objectStore(STORE));
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	} finally {
		db.close();
	}
};

/** `key`: which slot, the Grantulator's by default. */
export const saveSample = (sample: StoredSample, key = KEY) =>
	transact("readwrite", (store) => store.put(sample, key)).then(() => {});

export const loadSample = (key = KEY) =>
	transact<StoredSample | undefined>("readonly", (store) => store.get(key));

export const deleteSample = (key = KEY) =>
	transact("readwrite", (store) => store.delete(key)).then(() => {});
