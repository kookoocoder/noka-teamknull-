"use server";

import { prisma } from "@/lib/prisma";
import {
  sha256Base64Url,
  canonicalStringify,
  computeEventHash,
  generateUniqueHashId,
  type ProvenancePayload,
} from "@/lib/provenance";
import type { ProvenanceEventType } from "@/generated/prisma";

const GENESIS_HASH = "GENESIS";

/**
 * Ensure user has a publicHashId, create if missing
 */
export async function ensureActorHash(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, publicHashId: true, email: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.publicHashId) {
    return user.publicHashId;
  }

  // Generate new hash
  const publicHashId = await generateUniqueHashId("USER", `${user.id}:${user.email}`);

  await prisma.user.update({
    where: { id: userId },
    data: { publicHashId },
  });

  return publicHashId;
}

/**
 * Ensure product listing has a productHashId, create if missing
 */
export async function ensureProductHash(listingId: string): Promise<string> {
  const listing = await prisma.produceListing.findUnique({
    where: { id: listingId },
    select: { id: true, productHashId: true, cropType: true, farmerId: true },
  });

  if (!listing) {
    throw new Error("Listing not found");
  }

  if (listing.productHashId) {
    return listing.productHashId;
  }

  // Generate new hash
  const productHashId = await generateUniqueHashId(
    "PRODUCT",
    `${listing.id}:${listing.cropType}:${listing.farmerId}`
  );

  await prisma.produceListing.update({
    where: { id: listingId },
    data: { productHashId },
  });

  return productHashId;
}

/**
 * Create a new provenance chain for an order (genesis event)
 */
export async function createChainForOrder(
  orderId: string,
  farmerId: string,
  buyerId: string,
  listingId: string,
  payload: ProvenancePayload
): Promise<void> {
  // Ensure all actors and product have hash IDs
  const [farmerHash, buyerHash, productHash] = await Promise.all([
    ensureActorHash(farmerId),
    ensureActorHash(buyerId),
    ensureProductHash(listingId),
  ]);

  // Enrich payload with hash IDs
  const enrichedPayload: ProvenancePayload = {
    ...payload,
    farmerPublicHashId: farmerHash,
    buyerPublicHashId: buyerHash,
    productHashId: productHash,
    listingId,
    at: new Date().toISOString(),
  };

  // Compute genesis hash
  const hash = await computeEventHash(GENESIS_HASH, "ORDER_CREATED", enrichedPayload);

  // Create chain and first event
  await prisma.provenanceChain.create({
    data: {
      orderId,
      lastHash: hash,
      events: {
        create: {
          index: 0,
          type: "ORDER_CREATED",
          actorId: buyerId,
          prevHash: GENESIS_HASH,
          hash,
          payload: enrichedPayload as any,
        },
      },
    },
  });
}

/**
 * Append a new event to the provenance chain
 */
export async function appendEvent(
  orderId: string,
  type: ProvenanceEventType,
  actorId: string,
  payload: ProvenancePayload
): Promise<void> {
  const chain = await prisma.provenanceChain.findUnique({
    where: { orderId },
    include: {
      events: {
        orderBy: { index: "desc" },
        take: 1,
      },
    },
  });

  if (!chain) {
    throw new Error("Provenance chain not found for order");
  }

  const lastEvent = chain.events[0];
  const nextIndex = lastEvent ? lastEvent.index + 1 : 0;
  const prevHash = chain.lastHash;

  // Enrich payload with timestamp
  const enrichedPayload: ProvenancePayload = {
    ...payload,
    at: new Date().toISOString(),
  };

  // Compute new hash
  const hash = await computeEventHash(prevHash, type, enrichedPayload);

  // Create event and update chain
  await prisma.$transaction([
    prisma.provenanceEvent.create({
      data: {
        chainId: chain.id,
        index: nextIndex,
        type,
        actorId,
        prevHash,
        hash,
        payload: enrichedPayload as any,
      },
    }),
    prisma.provenanceChain.update({
      where: { id: chain.id },
      data: { lastHash: hash },
    }),
  ]);
}

/**
 * Get and verify the complete provenance chain for an order
 */
export async function getChain(orderId: string) {
  const chain = await prisma.provenanceChain.findUnique({
    where: { orderId },
    include: {
      order: {
        include: {
          listing: {
            include: {
              farmer: {
                select: {
                  id: true,
                  name: true,
                  publicHashId: true,
                  location: true,
                  email: true,
                },
              },
            },
          },
          buyer: {
            select: {
              id: true,
              name: true,
              publicHashId: true,
              location: true,
              email: true,
            },
          },
          shipment: {
            include: {
              transporter: {
                select: {
                  id: true,
                  name: true,
                  publicHashId: true,
                  location: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      events: {
        orderBy: { index: "asc" },
      },
    },
  });

  if (!chain) {
    return null;
  }

  // Verify chain integrity
  let verified = true;
  let expectedPrevHash = GENESIS_HASH;

  for (const event of chain.events) {
    // Check prevHash matches
    if (event.prevHash !== expectedPrevHash) {
      verified = false;
      break;
    }

    // Recompute hash
    const recomputedHash = await computeEventHash(
      event.prevHash,
      event.type,
      event.payload as ProvenancePayload
    );

    if (recomputedHash !== event.hash) {
      verified = false;
      break;
    }

    expectedPrevHash = event.hash;
  }

  // Check final hash matches chain.lastHash
  if (chain.events.length > 0 && chain.events[chain.events.length - 1].hash !== chain.lastHash) {
    verified = false;
  }

  return {
    chain,
    verified,
    lastHash: chain.lastHash,
    order: chain.order,
    listing: chain.order.listing,
    farmer: chain.order.listing.farmer,
    buyer: chain.order.buyer,
    transporter: chain.order.shipment?.transporter,
    events: chain.events,
  };
}

/**
 * Verify chain by order ID, return boolean and details
 */
export async function verifyChainByOrderId(orderId: string) {
  const data = await getChain(orderId);
  if (!data) return { success: false as const, verified: false, error: "Chain not found" };
  return { success: true as const, verified: data.verified, details: data };
}

/**
 * Verify an array of events offline (manual paste) without touching DB
 * Expects events sorted by index ascending
 */
export async function verifyEventsOffline(events: Array<{
  index: number;
  type: ProvenanceEventType;
  prevHash: string;
  hash: string;
  payload: ProvenancePayload;
}>) {
  let expectedPrev = GENESIS_HASH;
  for (const ev of events) {
    if (ev.prevHash !== expectedPrev) {
      return { verified: false as const, error: `prevHash mismatch at index ${ev.index}` };
    }
    const computed = await computeEventHash(ev.prevHash, ev.type, ev.payload);
    if (computed !== ev.hash) {
      return { verified: false as const, error: `hash mismatch at index ${ev.index}` };
    }
    expectedPrev = ev.hash;
  }
  return { verified: true as const, lastHash: expectedPrev };
}

