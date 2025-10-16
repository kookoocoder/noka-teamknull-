import crypto from "node:crypto";

export type ProvenancePayload = {
  orderId: string;
  listingId?: string;
  productHashId?: string;
  farmerPublicHashId?: string;
  buyerPublicHashId?: string;
  transporterPublicHashId?: string;
  shipmentId?: string;
  status?: string;
  notes?: string;
  temperature?: number;
  humidity?: number;
  quantity?: number;
  totalPrice?: number;
  at: string; // ISO timestamp
};

/**
 * Compute SHA-256 hash and return as base64url string
 */
export async function sha256Base64Url(input: string): Promise<string> {
  const hash = crypto.createHash("sha256").update(input, "utf8").digest("base64url");
  return hash;
}

/**
 * Canonically stringify object with sorted keys for deterministic hashing
 */
export function canonicalStringify(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj);
  }
  
  if (typeof obj !== "object" || Array.isArray(obj)) {
    return JSON.stringify(obj);
  }
  
  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const sortedObj: Record<string, unknown> = {};
  
  for (const key of sortedKeys) {
    const value = (obj as Record<string, unknown>)[key];
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sortedObj[key] = JSON.parse(canonicalStringify(value));
    } else {
      sortedObj[key] = value;
    }
  }
  
  return JSON.stringify(sortedObj);
}

/**
 * Compute event hash from previous hash, event type, and payload
 * Hash = SHA256(prevHash || "|" || type || "|" || canonicalPayload)
 */
export async function computeEventHash(
  prevHash: string,
  type: string,
  payload: ProvenancePayload
): Promise<string> {
  const canonical = canonicalStringify(payload);
  const input = `${prevHash}|${type}|${canonical}`;
  return await sha256Base64Url(input);
}

/**
 * Generate a unique hash ID for actors (users) or products
 */
export async function generateUniqueHashId(prefix: string, uniqueData: string): Promise<string> {
  const input = `${prefix}:${uniqueData}:${Date.now()}`;
  return await sha256Base64Url(input);
}

