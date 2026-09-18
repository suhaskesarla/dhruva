// Native durable storage adapters (plan §5 "Expo authentication, storage and
// transport"). Two separate stores:
//   - authStorage: Supabase SDK session material (session, PKCE verifier) in
//     OS-backed secure storage via expo-secure-store, chunked transparently so a
//     full-size session survives the per-entry size limit.
//   - outbox / pending destination: owner-scoped pending captures and the
//     allowed post-auth destination in persistent app storage via AsyncStorage.
// Values are never logged. The native modules are loaded lazily and are
// injectable so the logic can be exercised with in-memory fakes.
import { localCaptureSchema, uuidSchema, type LocalCapture, type UUID } from "@dhruva/contracts";

export type PendingDestination = "/chat" | "/setup";
const PENDING_DESTINATIONS: readonly PendingDestination[] = ["/chat", "/setup"];

/** Minimal surface of expo-secure-store used by `authStorage`. */
export interface SecureBackend {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

/** Minimal surface of AsyncStorage used by the outbox and destination store. */
export interface KeyValueBackend {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
}

export interface StorageAdapters {
  authStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };
  readOutbox(ownerId: UUID): Promise<LocalCapture[]>;
  putOutboxCapture(capture: LocalCapture): Promise<void>;
  removeOutboxCapture(ownerId: UUID, messageId: UUID): Promise<void>;
  savePendingDestination(path: PendingDestination): Promise<void>;
  takePendingDestination(): Promise<PendingDestination | null>;
}

// --- Secure session storage -------------------------------------------------

// SecureStore rejects/warns on values above 2048 bytes (Android). Chunks are
// measured in UTF-8 bytes and kept well under that limit.
const SECURE_CHUNK_BYTES = 1800;
const SECURE_PREFIX = "dhruva.auth.";
const MANIFEST_VERSION = 1;

interface ChunkManifest {
  v: number;
  n: number;
}

// SecureStore keys may contain only alphanumerics, ".", "-" and "_". Replace
// anything else and append a hash of the original so distinct keys stay distinct.
function sanitizeSecureKey(key: string): string {
  const safe = key.replace(/[^A-Za-z0-9._-]/g, "_");
  if (safe === key) return SECURE_PREFIX + key;
  let hash = 5381;
  for (let i = 0; i < key.length; i += 1) hash = ((hash * 33) ^ key.charCodeAt(i)) >>> 0;
  return `${SECURE_PREFIX}${safe}.h${hash.toString(16)}`;
}

function manifestKey(base: string): string {
  return `${base}.m`;
}

function chunkKey(base: string, index: number): string {
  return `${base}.c${index}`;
}

function utf8ByteLength(codeUnit: number, next: number | undefined): { bytes: number; units: number } {
  if (codeUnit < 0x80) return { bytes: 1, units: 1 };
  if (codeUnit < 0x800) return { bytes: 2, units: 1 };
  const isHighSurrogate = codeUnit >= 0xd800 && codeUnit <= 0xdbff;
  if (isHighSurrogate && next !== undefined && next >= 0xdc00 && next <= 0xdfff) {
    return { bytes: 4, units: 2 };
  }
  return { bytes: 3, units: 1 };
}

// Split without breaking surrogate pairs; each chunk encodes to <= maxBytes.
function splitByUtf8Bytes(value: string, maxBytes: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  let cursor = 0;
  let bytes = 0;
  while (cursor < value.length) {
    const step = utf8ByteLength(value.charCodeAt(cursor), value.charCodeAt(cursor + 1));
    if (bytes + step.bytes > maxBytes && cursor > start) {
      chunks.push(value.slice(start, cursor));
      start = cursor;
      bytes = 0;
    }
    bytes += step.bytes;
    cursor += step.units;
  }
  chunks.push(value.slice(start));
  return chunks;
}

function parseManifest(raw: string | null): ChunkManifest | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" && parsed !== null &&
      (parsed as ChunkManifest).v === MANIFEST_VERSION &&
      Number.isInteger((parsed as ChunkManifest).n) && (parsed as ChunkManifest).n >= 0
    ) {
      return parsed as ChunkManifest;
    }
  } catch {
    // Not a manifest written by this adapter; treat as absent.
  }
  return null;
}

function createAuthStorage(secure: SecureBackend): StorageAdapters["authStorage"] {
  async function deleteChunks(base: string, from: number, to: number): Promise<void> {
    for (let i = from; i < to; i += 1) await secure.deleteItemAsync(chunkKey(base, i));
  }

  return {
    async getItem(key) {
      const base = sanitizeSecureKey(key);
      const manifest = parseManifest(await secure.getItemAsync(manifestKey(base)));
      if (manifest === null) return null;
      const parts: string[] = [];
      for (let i = 0; i < manifest.n; i += 1) {
        const part = await secure.getItemAsync(chunkKey(base, i));
        // A missing chunk means the entry is unusable; report absent rather than corrupt.
        if (part === null) return null;
        parts.push(part);
      }
      return parts.join("");
    },

    async setItem(key, value) {
      const base = sanitizeSecureKey(key);
      const previous = parseManifest(await secure.getItemAsync(manifestKey(base)));
      const chunks = splitByUtf8Bytes(value, SECURE_CHUNK_BYTES);
      for (let i = 0; i < chunks.length; i += 1) {
        await secure.setItemAsync(chunkKey(base, i), chunks[i]);
      }
      const manifest: ChunkManifest = { v: MANIFEST_VERSION, n: chunks.length };
      await secure.setItemAsync(manifestKey(base), JSON.stringify(manifest));
      if (previous !== null) await deleteChunks(base, chunks.length, previous.n);
    },

    async removeItem(key) {
      const base = sanitizeSecureKey(key);
      const manifest = parseManifest(await secure.getItemAsync(manifestKey(base)));
      await secure.deleteItemAsync(manifestKey(base));
      if (manifest !== null) await deleteChunks(base, 0, manifest.n);
    },
  };
}

// --- Owner-scoped outbox and pending destination ----------------------------

const OUTBOX_PREFIX = "dhruva.outbox.";
const DESTINATION_KEY = "dhruva.pending_destination";
const OUTBOX_RECORD_VERSION = 1;

interface OutboxRecord {
  v: number;
  saved_at: string;
  capture: LocalCapture;
}

function outboxOwnerPrefix(ownerId: UUID): string {
  return `${OUTBOX_PREFIX}${ownerId}.`;
}

function outboxKey(ownerId: UUID, messageId: UUID): string {
  return `${outboxOwnerPrefix(ownerId)}${messageId}`;
}

function parseOutboxRecord(raw: string | null, ownerId: UUID): OutboxRecord | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const record = parsed as Partial<OutboxRecord>;
    if (record.v !== OUTBOX_RECORD_VERSION || typeof record.saved_at !== "string") return null;
    const capture = localCaptureSchema.safeParse(record.capture);
    // The key already scopes by owner; the stored owner must agree as well.
    if (!capture.success || capture.data.owner_id !== ownerId) return null;
    return { v: record.v, saved_at: record.saved_at, capture: capture.data };
  } catch {
    return null;
  }
}

function isPendingDestination(value: unknown): value is PendingDestination {
  return typeof value === "string" && (PENDING_DESTINATIONS as readonly string[]).includes(value);
}

function createAppStorage(
  store: KeyValueBackend,
  now: () => Date,
): Omit<StorageAdapters, "authStorage"> {
  return {
    async readOutbox(ownerId) {
      if (!uuidSchema.safeParse(ownerId).success) return [];
      const prefix = outboxOwnerPrefix(ownerId);
      const keys = (await store.getAllKeys()).filter((key) => key.startsWith(prefix));
      const records = await Promise.all(
        keys.map(async (key) => parseOutboxRecord(await store.getItem(key), ownerId)),
      );
      return records
        .filter((record): record is OutboxRecord => record !== null)
        .sort((a, b) => a.saved_at.localeCompare(b.saved_at) ||
          a.capture.message_id.localeCompare(b.capture.message_id))
        .map((record) => record.capture);
    },

    async putOutboxCapture(capture) {
      // Refuse to persist anything that does not satisfy the shared contract.
      const valid = localCaptureSchema.parse(capture);
      const record: OutboxRecord = {
        v: OUTBOX_RECORD_VERSION, saved_at: now().toISOString(), capture: valid,
      };
      await store.setItem(outboxKey(valid.owner_id, valid.message_id), JSON.stringify(record));
    },

    async removeOutboxCapture(ownerId, messageId) {
      // Only the explicit acknowledged-completion path calls this; the key is
      // derived from the caller's owner, so another identity cannot remove it.
      await store.removeItem(outboxKey(uuidSchema.parse(ownerId), uuidSchema.parse(messageId)));
    },

    async savePendingDestination(path) {
      if (!isPendingDestination(path)) throw new Error("Destination not allowed");
      await store.setItem(DESTINATION_KEY, path);
    },

    async takePendingDestination() {
      const raw = await store.getItem(DESTINATION_KEY);
      if (raw === null) return null;
      await store.removeItem(DESTINATION_KEY);
      return isPendingDestination(raw) ? raw : null;
    },
  };
}

// --- Native backends (loaded lazily so non-native runtimes never import them) --

function createNativeSecureBackend(): SecureBackend {
  let modulePromise: Promise<typeof import("expo-secure-store")> | undefined;
  const load = () => (modulePromise ??= import("expo-secure-store"));
  return {
    getItemAsync: async (key) => (await load()).getItemAsync(key),
    setItemAsync: async (key, value) => (await load()).setItemAsync(key, value),
    deleteItemAsync: async (key) => (await load()).deleteItemAsync(key),
  };
}

function createNativeKeyValueBackend(): KeyValueBackend {
  let modulePromise: Promise<typeof import("@react-native-async-storage/async-storage")> | undefined;
  const load = async () => (await (modulePromise ??= import("@react-native-async-storage/async-storage"))).default;
  return {
    getItem: async (key) => (await load()).getItem(key),
    setItem: async (key, value) => (await load()).setItem(key, value),
    removeItem: async (key) => (await load()).removeItem(key),
    getAllKeys: async () => (await load()).getAllKeys(),
  };
}

export interface StorageBackends {
  secure?: SecureBackend;
  keyValue?: KeyValueBackend;
  now?: () => Date;
}

/**
 * Build the storage adapters over explicit backends. Production uses the
 * module-level exports below; tests pass in-memory fakes.
 */
export function createStorage(backends: StorageBackends = {}): StorageAdapters {
  return {
    authStorage: createAuthStorage(backends.secure ?? createNativeSecureBackend()),
    ...createAppStorage(backends.keyValue ?? createNativeKeyValueBackend(), backends.now ?? (() => new Date())),
  };
}

const defaultStorage = createStorage();

export const authStorage: StorageAdapters["authStorage"] = defaultStorage.authStorage;
export const readOutbox: StorageAdapters["readOutbox"] = defaultStorage.readOutbox;
export const putOutboxCapture: StorageAdapters["putOutboxCapture"] = defaultStorage.putOutboxCapture;
export const removeOutboxCapture: StorageAdapters["removeOutboxCapture"] = defaultStorage.removeOutboxCapture;
export const savePendingDestination: StorageAdapters["savePendingDestination"] =
  defaultStorage.savePendingDestination;
export const takePendingDestination: StorageAdapters["takePendingDestination"] =
  defaultStorage.takePendingDestination;
