"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { verifyChainByOrderId, verifyEventsOffline, getChain } from "@/app/actions/provenance";
import Link from "next/link";

export default function VerifyPage() {
  const [orderId, setOrderId] = useState("");
  const [eventsJson, setEventsJson] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [orderIdForHash, setOrderIdForHash] = useState("");
  const [expectedHash, setExpectedHash] = useState("");
  const [chainInfo, setChainInfo] = useState<{ lastHash: string; events: number } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleVerifyByOrder() {
    setLoading(true);
    setResult(null);
    try {
      const res = await verifyChainByOrderId(orderId.trim());
      if (!res.success) setResult(`❌ ${res.error}`);
      else {
        const details = res.details;
        setChainInfo({ lastHash: details!.lastHash, events: details!.events.length });
        setResult(res.verified ? "✅ Chain verified" : "⚠️ Chain integrity issue");
      }
    } catch (e: any) {
      setResult(`❌ ${e?.message || "Failed"}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOffline() {
    setLoading(true);
    setResult(null);
    try {
      const parsed = JSON.parse(eventsJson);
      const res = await verifyEventsOffline(parsed);
      setResult(res.verified ? `✅ Events verified. lastHash=${res.lastHash}` : `❌ ${res.error}`);
    } catch (e: any) {
      setResult(`❌ ${e?.message || "Invalid JSON"}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyLastHash() {
    setLoading(true);
    setResult(null);
    try {
      const data = await getChain(orderIdForHash.trim());
      if (!data) {
        setResult("❌ Chain not found for this order ID");
      } else {
        const matches = data.lastHash === expectedHash.trim();
        setResult(matches ? "✅ Last hash matches stored chain" : `❌ Mismatch. Stored lastHash=${data.lastHash}`);
      }
    } catch (e: any) {
      setResult(`❌ ${e?.message || "Failed"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Verify Provenance Manually</h1>

        <Card className="p-6 space-y-3">
          <h2 className="font-semibold">Verify by Order ID + Final Hash</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input value={orderIdForHash} onChange={(e) => setOrderIdForHash(e.target.value)} placeholder="Order ID" />
            <Input value={expectedHash} onChange={(e) => setExpectedHash(e.target.value)} placeholder="Expected final hash" />
          </div>
          <Button onClick={handleVerifyLastHash} disabled={!orderIdForHash || !expectedHash || loading}>
            {loading ? "Verifying..." : "Compare Final Hash"}
          </Button>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="font-semibold">Verify by Order ID</h2>
          <div className="flex gap-2">
            <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order ID" />
            <Button onClick={handleVerifyByOrder} disabled={!orderId || loading}>
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </div>
          {chainInfo && (
            <div className="mt-3 text-xs text-muted-foreground">
              <div>Events: <span className="font-medium text-foreground">{chainInfo.events}</span></div>
              <div className="break-all">Final hash: <span className="font-mono">{chainInfo.lastHash}</span></div>
              <div className="mt-1">
                <Link href={`/scan/${orderId}`} className="underline">Open public scan</Link>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="font-semibold">Verify by Pasting Events (JSON)</h2>
          <Textarea
            value={eventsJson}
            onChange={(e) => setEventsJson(e.target.value)}
            placeholder='[
  { "index": 0, "type": "ORDER_CREATED", "prevHash": "GENESIS", "hash": "...", "payload": { "orderId": "...", "at": "..." } },
  { "index": 1, "type": "PAYMENT_CONFIRMED", "prevHash": "...", "hash": "...", "payload": { "orderId": "...", "at": "..." } }
]'
            className="min-h-48"
          />
          <Button onClick={handleVerifyOffline} disabled={!eventsJson || loading}>
            {loading ? "Verifying..." : "Verify Offline"}
          </Button>
        </Card>

        {result && (
          <Card className="p-4 text-sm">
            <div className="whitespace-pre-wrap">{result}</div>
          </Card>
        )}
      </div>
    </div>
  );
}


