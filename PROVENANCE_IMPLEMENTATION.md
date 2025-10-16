# Product Provenance Implementation

## Overview

This implementation adds a complete, verifiable provenance chain to track products from farmer to final delivery with full transparency. Each order has its own blockchain-inspired hash chain that records every transaction and event.

## Key Features

### 1. **Unique Hash IDs**
- **User Hash IDs** (`publicHashId`): Every farmer, buyer, and transporter has a unique, stable public hash ID
- **Product Hash IDs** (`productHashId`): Each produce listing has a unique hash identifying the product batch

### 2. **Provenance Chain**
Each order creates an immutable, append-only chain of events:
- **Genesis Event**: `ORDER_CREATED` - When buyer places order (includes farmer, buyer, product hashes)
- **Payment**: `PAYMENT_CONFIRMED` - When payment is processed
- **Farmer Acceptance**: `ORDER_ACCEPTED` - When farmer accepts the order
- **Transporter Assignment**: `SHIPMENT_CREATED` - When transporter is assigned
- **Status Updates**: `SHIPMENT_STATUS_UPDATED` - During transit (pickup, in-transit)
- **Storage Logs**: `STORAGE_LOGGED` - Temperature/humidity readings
- **Final Delivery**: `DELIVERED` - When order is delivered

### 3. **Cryptographic Verification**
- Each event is linked via SHA-256 hashes
- Hash = `SHA256(previousHash | eventType | canonicalPayload)`
- Chain integrity can be verified by replaying all events
- Any tampering breaks the chain verification

## Database Schema

### New Models

```prisma
enum ProvenanceEventType {
  ORDER_CREATED
  PAYMENT_CONFIRMED
  ORDER_ACCEPTED
  SHIPMENT_CREATED
  SHIPMENT_STATUS_UPDATED
  STORAGE_LOGGED
  DELIVERED
}

model ProvenanceChain {
  id         String   @id @default(uuid())
  orderId    String   @unique
  order      Order    @relation(...)
  lastHash   String   // Latest hash in the chain
  events     ProvenanceEvent[]
}

model ProvenanceEvent {
  id         String               @id @default(uuid())
  chainId    String
  index      Int                  // Event sequence number
  type       ProvenanceEventType
  actorId    String               // User who triggered event
  prevHash   String               // Previous event hash
  hash       String               // This event's hash
  payload    Json                 // Event data snapshot
  createdAt  DateTime
}
```

### Updated Models

```prisma
model User {
  // ... existing fields
  publicHashId   String   @unique
}

model ProduceListing {
  // ... existing fields
  productHashId  String   @unique
}

model Order {
  // ... existing fields
  provenanceChain ProvenanceChain?
}
```

## API & Server Actions

### `/src/app/actions/provenance.ts`

**Core Functions:**
- `ensureActorHash(userId)` - Creates/retrieves user's public hash ID
- `ensureProductHash(listingId)` - Creates/retrieves product hash ID
- `createChainForOrder(orderId, farmerId, buyerId, listingId, payload)` - Genesis event
- `appendEvent(orderId, type, actorId, payload)` - Add event to chain
- `getChain(orderId)` - Retrieve and verify complete chain

### Integration Points

Events are automatically emitted from:
- **`orders.ts`**: Order creation, farmer acceptance
- **`payment.ts`**: Payment confirmation
- **`transporters.ts`**: Transporter assignment
- **`shipments.ts`**: Status updates, delivery
- **`storage.ts`**: Storage condition logs

## User Interface

### `/scan/[orderId]` - Public Provenance Scanner

Public page showing:
- ✅ Chain verification status
- 📦 Product details (crop type, quantity, harvest date, price)
- 👥 Full stakeholder information:
  - Farmer (name, location, email, hash ID)
  - Buyer/Distributor (name, location, email, hash ID)
  - Transporter (name, location, email, hash ID)
- 📜 Complete event timeline with:
  - Event type and timestamp
  - Event-specific data (temperature, status, etc.)
  - Cryptographic hash for each event

### Order Detail Page Enhancement

Added "View Provenance Chain" button to `/orders/[id]` linking to the scan page.

## Data Flow Example

1. **Buyer places order** → Genesis event created
   ```json
   {
     "type": "ORDER_CREATED",
     "farmerPublicHashId": "abc123...",
     "buyerPublicHashId": "def456...",
     "productHashId": "ghi789...",
     "quantity": 100,
     "totalPrice": 3000
   }
   ```

2. **Buyer pays** → Payment confirmed event
   ```json
   {
     "type": "PAYMENT_CONFIRMED",
     "totalPrice": 3000
   }
   ```

3. **Farmer accepts** → Order accepted event
   ```json
   {
     "type": "ORDER_ACCEPTED",
     "status": "ACCEPTED"
   }
   ```

4. **Transporter assigned** → Shipment created event
   ```json
   {
     "type": "SHIPMENT_CREATED",
     "transporterPublicHashId": "jkl012...",
     "shipmentId": "xyz..."
   }
   ```

5. **Transit updates** → Status update events
   ```json
   {
     "type": "SHIPMENT_STATUS_UPDATED",
     "status": "IN_TRANSIT",
     "notes": "Location: Mumbai Highway"
   }
   ```

6. **Storage logs** → Storage logged events
   ```json
   {
     "type": "STORAGE_LOGGED",
     "temperature": 8,
     "humidity": 65
   }
   ```

7. **Final delivery** → Delivered event
   ```json
   {
     "type": "DELIVERED",
     "status": "DELIVERED"
   }
   ```

## Hash Chain Verification

The `getChain` function verifies integrity by:
1. Starting with `prevHash = "GENESIS"`
2. For each event in sequence:
   - Verify `event.prevHash === expectedPrevHash`
   - Recompute hash: `SHA256(prevHash | type | payload)`
   - Verify computed hash matches stored `event.hash`
   - Set `expectedPrevHash = event.hash`
3. Verify final event hash matches `chain.lastHash`

If any step fails → `verified = false`

## Seed Data Migration

Updated `/prisma/seed.ts` to:
- Generate `publicHashId` for all test users (farmer, buyer, transporter)
- Generate `productHashId` for all produce listings (tomatoes, wheat, rice)

## Benefits

### Transparency
- Every stakeholder and transaction is permanently recorded
- Public scan page provides full visibility to all parties

### Traceability
- Track product from origin (farmer) through every handler
- Immutable record of storage conditions and transit

### Trust & Verification
- Cryptographic hashing prevents tampering
- Chain verification ensures data integrity
- Stable hash IDs for actors and products

### Compliance & Accountability
- Complete audit trail for regulatory requirements
- Temperature/humidity logs for food safety
- Timestamped events for dispute resolution

## Technical Stack

- **Hashing**: Node.js `crypto` module with SHA-256
- **Encoding**: Base64URL for compact hash representation
- **Data Format**: Canonical JSON (sorted keys) for deterministic hashing
- **Database**: PostgreSQL with Prisma ORM
- **UI**: Next.js 15, React 19, Tailwind CSS, shadcn/ui

## Future Enhancements

Potential additions:
- QR code generation for easy mobile scanning
- Export provenance as PDF certificate
- Smart contract integration for blockchain deployment
- Multi-signature verification for critical events
- Geolocation tracking integration
- Real-time chain updates via WebSockets

