"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ProvenanceTimeline } from "@/components/provenance-timeline";
import { getChain } from "@/app/actions/provenance";

type ChainData = Awaited<ReturnType<typeof getChain>>;

export default function ScanProvenancePage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [chainData, setChainData] = useState<ChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChain() {
      try {
        setLoading(true);
        const data = await getChain(orderId);
        if (!data) {
          setError("Provenance chain not found for this order");
        } else {
          setChainData(data);
        }
      } catch (err) {
        console.error("Error fetching provenance chain:", err);
        setError("Failed to load provenance chain");
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      fetchChain();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !chainData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
            <p className="text-gray-600">{error || "Chain not found"}</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Product Provenance</h1>
          <p className="text-gray-600">Complete transparency from farm to delivery</p>
        </div>

        {/* Chain Hash */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">Chain Hash</h2>
          <p className="text-xs font-mono text-gray-600 break-all bg-gray-50 p-3 rounded">
            {chainData.lastHash}
          </p>
        </Card>

        {/* Product Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Product Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Crop Type</p>
              <p className="font-medium">{chainData.listing.cropType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Quantity</p>
              <p className="font-medium">{chainData.order.quantity} kg</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Harvest Date</p>
              <p className="font-medium">
                {new Date(chainData.listing.harvestDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Price</p>
              <p className="font-medium">₹{chainData.order.totalPrice}</p>
            </div>
          </div>
          {chainData.listing.description && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-gray-700">{chainData.listing.description}</p>
            </div>
          )}
        </Card>

        {/* Stakeholders */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Stakeholders</h2>
          <div className="space-y-4">
            {/* Farmer */}
            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-sm text-gray-500">Farmer</p>
              <p className="font-medium">{chainData.farmer.name}</p>
              <p className="text-sm text-gray-600">{chainData.farmer.location}</p>
              <p className="text-xs text-gray-500">Email: {chainData.farmer.email}</p>
              <p className="text-xs font-mono text-gray-400 mt-1">
                Hash: {chainData.farmer.publicHashId}
              </p>
            </div>

            {/* Buyer */}
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-500">Buyer/Distributor</p>
              <p className="font-medium">{chainData.buyer.name}</p>
              <p className="text-sm text-gray-600">{chainData.buyer.location}</p>
              <p className="text-xs text-gray-500">Email: {chainData.buyer.email}</p>
              <p className="text-xs font-mono text-gray-400 mt-1">
                Hash: {chainData.buyer.publicHashId}
              </p>
            </div>

            {/* Transporter */}
            {chainData.transporter && (
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-500">Transporter</p>
                <p className="font-medium">{chainData.transporter.name}</p>
                <p className="text-sm text-gray-600">{chainData.transporter.location}</p>
                <p className="text-xs text-gray-500">Email: {chainData.transporter.email}</p>
                <p className="text-xs font-mono text-gray-400 mt-1">
                  Hash: {chainData.transporter.publicHashId}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Provenance Timeline */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          <ProvenanceTimeline 
            events={chainData.events.map(e => ({
              ...e,
              payload: e.payload as any,
            }))} 
            verified={chainData.verified} 
          />
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>
            This provenance chain is cryptographically secured and provides complete transparency
            of the product journey from farm to delivery.
          </p>
        </div>
      </div>
    </div>
  );
}

