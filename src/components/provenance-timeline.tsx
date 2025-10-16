"use client";

import { Card } from "@/components/ui/card";
import type { ProvenanceEventType } from "@/generated/prisma";
import type { ProvenancePayload } from "@/lib/provenance";

interface ProvenanceEvent {
  id: string;
  type: ProvenanceEventType;
  hash: string;
  payload: ProvenancePayload;
  createdAt: Date;
  index: number;
}

interface ProvenanceTimelineProps {
  events: ProvenanceEvent[];
  verified: boolean;
}

const eventTypeLabels: Record<ProvenanceEventType, string> = {
  ORDER_CREATED: "Order Created",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  ORDER_ACCEPTED: "Order Accepted by Farmer",
  SHIPMENT_CREATED: "Transporter Assigned",
  SHIPMENT_STATUS_UPDATED: "Shipment Status Updated",
  STORAGE_LOGGED: "Storage Conditions Logged",
  DELIVERED: "Delivered",
};

const eventTypeIcons: Record<ProvenanceEventType, string> = {
  ORDER_CREATED: "🛒",
  PAYMENT_CONFIRMED: "💳",
  ORDER_ACCEPTED: "✅",
  SHIPMENT_CREATED: "🚚",
  SHIPMENT_STATUS_UPDATED: "📍",
  STORAGE_LOGGED: "🌡️",
  DELIVERED: "📦",
};

export function ProvenanceTimeline({ events, verified }: ProvenanceTimelineProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          verified 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}>
          {verified ? "✓ Chain Verified" : "⚠ Chain Integrity Issue"}
        </div>
      </div>

      <div className="relative space-y-6">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {events.map((event, idx) => (
          <div key={event.id} className="relative flex gap-4">
            {/* Timeline dot */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl z-10">
                {eventTypeIcons[event.type]}
              </div>
            </div>

            {/* Event card */}
            <Card className="flex-1 p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{eventTypeLabels[event.type]}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(event.payload.at).toLocaleString()}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                {event.type === "ORDER_CREATED" && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Farmer Hash:</span>
                        <p className="text-xs text-gray-600 font-mono break-all">
                          {event.payload.farmerPublicHashId}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Buyer Hash:</span>
                        <p className="text-xs text-gray-600 font-mono break-all">
                          {event.payload.buyerPublicHashId}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Product Hash:</span>
                      <p className="text-xs text-gray-600 font-mono break-all">
                        {event.payload.productHashId}
                      </p>
                    </div>
                    {event.payload.quantity && (
                      <p><span className="font-medium">Quantity:</span> {event.payload.quantity} kg</p>
                    )}
                    {event.payload.totalPrice && (
                      <p><span className="font-medium">Total Price:</span> ₹{event.payload.totalPrice}</p>
                    )}
                  </>
                )}

                {event.type === "PAYMENT_CONFIRMED" && event.payload.totalPrice && (
                  <p><span className="font-medium">Amount Paid:</span> ₹{event.payload.totalPrice}</p>
                )}

                {(event.type === "SHIPMENT_CREATED" || event.type === "SHIPMENT_STATUS_UPDATED") && (
                  <>
                    {event.payload.transporterPublicHashId && (
                      <div>
                        <span className="font-medium">Transporter Hash:</span>
                        <p className="text-xs text-gray-600 font-mono break-all">
                          {event.payload.transporterPublicHashId}
                        </p>
                      </div>
                    )}
                    {event.payload.status && (
                      <p><span className="font-medium">Status:</span> {event.payload.status}</p>
                    )}
                  </>
                )}

                {event.type === "STORAGE_LOGGED" && (
                  <>
                    {event.payload.temperature !== undefined && (
                      <p><span className="font-medium">Temperature:</span> {event.payload.temperature}°C</p>
                    )}
                    {event.payload.humidity !== undefined && (
                      <p><span className="font-medium">Humidity:</span> {event.payload.humidity}%</p>
                    )}
                  </>
                )}

                {event.payload.notes && (
                  <p className="text-gray-600 italic">{event.payload.notes}</p>
                )}

                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
                    <p><span className="font-medium">Event Index:</span> {event.index}</p>
                    <p><span className="font-medium">Event Hash:</span></p>
                    <p className="font-mono text-xs break-all text-gray-600">{event.hash}</p>
                  </div>
                </details>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

