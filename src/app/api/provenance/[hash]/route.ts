"use server";

import { NextRequest, NextResponse } from "next/server";
import { getChain, verifyEventsOffline } from "@/app/actions/provenance";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;

    // First, try to find by order ID
    const chain = await getChain(hash);

    if (chain) {
      return NextResponse.json({
        success: true,
        type: "order_chain",
        data: chain,
      });
    }

    // If not found as order ID, try to find by last hash
    const chainByHash = await prisma.provenanceChain.findFirst({
      where: { lastHash: hash },
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

    if (chainByHash) {
      // Verify chain integrity
      let verified = true;
      let expectedPrevHash = "GENESIS";

      for (const event of chainByHash.events) {
        // Check prevHash matches
        if (event.prevHash !== expectedPrevHash) {
          verified = false;
          break;
        }

        // Recompute hash
        const { sha256Base64Url, computeEventHash } = await import("@/lib/provenance");
        const recomputedHash = await computeEventHash(
          event.prevHash,
          event.type,
          event.payload as any
        );

        if (recomputedHash !== event.hash) {
          verified = false;
          break;
        }

        expectedPrevHash = event.hash;
      }

      // Check final hash matches chain.lastHash
      if (chainByHash.events.length > 0 && chainByHash.events[chainByHash.events.length - 1].hash !== chainByHash.lastHash) {
        verified = false;
      }

      return NextResponse.json({
        success: true,
        type: "chain_hash",
        data: {
          chain: chainByHash,
          verified,
          lastHash: chainByHash.lastHash,
          order: chainByHash.order,
          listing: chainByHash.order.listing,
          farmer: chainByHash.order.listing.farmer,
          buyer: chainByHash.order.buyer,
          transporter: chainByHash.order.shipment?.transporter,
          events: chainByHash.events,
        },
      });
    }

    // Try to find by product hash
    const product = await prisma.produceListing.findFirst({
      where: { productHashId: hash },
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
    });

    if (product) {
      return NextResponse.json({
        success: true,
        type: "product",
        data: product,
      });
    }

    // Try to find by user hash
    const user = await prisma.user.findFirst({
      where: { publicHashId: hash },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        location: true,
        publicHashId: true,
      },
    });

    if (user) {
      return NextResponse.json({
        success: true,
        type: "user",
        data: user,
      });
    }

    return NextResponse.json({
      success: false,
      error: "Hash not found",
    });

  } catch (error) {
    console.error("Error verifying hash:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const body = await request.json();
    const { hash } = await params;

    if (!body.events || !Array.isArray(body.events)) {
      return NextResponse.json({
        success: false,
        error: "Invalid events data",
      });
    }

    // Verify events offline
    const result = await verifyEventsOffline(body.events);

    return NextResponse.json({
      success: true,
      verified: result.verified,
      lastHash: result.lastHash,
      error: result.error,
    });

  } catch (error) {
    console.error("Error verifying events:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    });
  }
}
