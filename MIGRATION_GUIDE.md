# Provenance System Migration Guide

## Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database connection
- Existing AgriTrack installation

## Step-by-Step Migration

### 1. Update Database Schema

The Prisma schema has been updated with new models and fields. Apply the changes:

```bash
# Generate Prisma client with new types
bun run prisma:generate

# Push schema changes to database (creates new tables and columns)
bun run db:push
```

**Schema Changes:**
- Added `publicHashId` field to `User` model
- Added `productHashId` field to `ProduceListing` model
- Created `ProvenanceEventType` enum
- Created `ProvenanceChain` model
- Created `ProvenanceEvent` model
- Added `provenanceChain` relation to `Order` model

### 2. Backfill Existing Data (Optional)

If you have existing users and products, you can backfill hash IDs:

**Option A: Reseed Database (Development)**
```bash
# Warning: This will clear existing data
bun run db:push --force-reset
bun run db:seed
```

**Option B: Backfill Script (Production)**

Create a migration script to add hash IDs to existing records:

```typescript
// scripts/backfill-hashes.ts
import { prisma } from "./src/lib/prisma";
import { generateUniqueHashId } from "./src/lib/provenance";

async function backfillHashes() {
  // Backfill user hash IDs
  const users = await prisma.user.findMany({
    where: { publicHashId: null },
  });

  for (const user of users) {
    const publicHashId = await generateUniqueHashId("USER", `${user.id}:${user.email}`);
    await prisma.user.update({
      where: { id: user.id },
      data: { publicHashId },
    });
    console.log(`✓ Updated user: ${user.email}`);
  }

  // Backfill product hash IDs
  const listings = await prisma.produceListing.findMany({
    where: { productHashId: null },
  });

  for (const listing of listings) {
    const productHashId = await generateUniqueHashId(
      "PRODUCT",
      `${listing.id}:${listing.cropType}:${listing.farmerId}`
    );
    await prisma.produceListing.update({
      where: { id: listing.id },
      data: { productHashId },
    });
    console.log(`✓ Updated listing: ${listing.cropType}`);
  }

  console.log("\n✅ Backfill completed!");
}

backfillHashes();
```

Run the backfill:
```bash
bun run scripts/backfill-hashes.ts
```

### 3. Verify Installation

Check that everything is working:

```bash
# Start development server
bun run dev
```

Test the provenance system:
1. Log in as a buyer (buyer@example.com / password123)
2. Place a new order from the marketplace
3. View the order details
4. Click "View Provenance Chain" button
5. Verify the genesis event is displayed

### 4. Test Complete Flow

To see the full provenance chain:

1. **Buyer**: Place order → Complete payment
2. **Farmer**: Accept order
3. **Transporter**: Accept job
4. **Transporter**: Update status (Picked Up → In Transit → Delivered)
5. **Transporter**: Log storage conditions
6. **Anyone**: View complete provenance chain at `/scan/[orderId]`

## New Files Created

### Core Library
- `/src/lib/provenance.ts` - Hashing and provenance utilities

### Server Actions
- `/src/app/actions/provenance.ts` - Provenance chain management

### UI Components
- `/src/components/provenance-timeline.tsx` - Timeline visualization

### Pages
- `/src/app/scan/[orderId]/page.tsx` - Public provenance scanner

### Documentation
- `/PROVENANCE_IMPLEMENTATION.md` - Technical documentation
- `/MIGRATION_GUIDE.md` - This file

## Modified Files

### Database
- `/prisma/schema.prisma` - Added provenance models
- `/prisma/seed.ts` - Generates hash IDs for seed data

### Server Actions (Integration)
- `/src/app/actions/orders.ts` - Emits ORDER_CREATED, ORDER_ACCEPTED
- `/src/app/actions/payment.ts` - Emits PAYMENT_CONFIRMED
- `/src/app/actions/transporters.ts` - Emits SHIPMENT_CREATED
- `/src/app/actions/shipments.ts` - Emits SHIPMENT_STATUS_UPDATED, DELIVERED
- `/src/app/actions/storage.ts` - Emits STORAGE_LOGGED

### UI Pages
- `/src/app/orders/[id]/page.tsx` - Added provenance chain button

## Environment Variables

No new environment variables required. The system uses your existing:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Authentication secret
- `BETTER_AUTH_URL` - Application URL

## Troubleshooting

### Issue: `publicHashId` or `productHashId` missing

**Solution**: Run the backfill script or ensure seed was executed after schema update.

### Issue: Provenance chain not found

**Solution**: The chain is only created for new orders placed after the migration. Existing orders won't have provenance chains unless manually created.

### Issue: Chain verification fails

**Possible causes**:
- Database corruption
- Manual data modification
- Event timestamps out of order

**Solution**: Check event hashes and sequence in the database.

### Issue: Database connection error during `db:push`

**Solution**: Verify your `DATABASE_URL` in `.env` is correct and the database is running.

## Rollback (Emergency)

If you need to rollback the changes:

```bash
# Revert to previous schema
git checkout HEAD~1 prisma/schema.prisma

# Push previous schema
bun run db:push

# Regenerate client
bun run prisma:generate
```

**Note**: This will drop the provenance tables and remove hash ID columns.

## Performance Considerations

- Hash computation is fast (< 1ms per event)
- Chain verification runs on-demand when viewing `/scan/[orderId]`
- Consider adding database indexes for frequently queried fields:

```sql
CREATE INDEX idx_provenance_event_chain_index ON provenance_event(chain_id, index);
CREATE INDEX idx_provenance_chain_order ON provenance_chain(order_id);
```

## Security Notes

- Hash IDs are **public** - they're designed to be shared
- They contain **no sensitive information** - just cryptographic hashes
- The provenance chain is **read-only** after creation - events cannot be modified
- Only authorized users can **append** events (through server actions)

## Support

For issues or questions:
1. Check `/PROVENANCE_IMPLEMENTATION.md` for technical details
2. Review event integration in `/src/app/actions/` files
3. Inspect database schema in `/prisma/schema.prisma`
4. Test with seed data: `bun run db:seed`

## Next Steps

After migration:
1. ✅ Test complete order flow
2. ✅ Verify provenance chain creation
3. ✅ Check scan page displays correctly
4. ✅ Ensure all events are being logged
5. ✅ Review chain verification works
6. 📋 Consider adding QR code generation
7. 📋 Implement PDF export for provenance certificates
8. 📋 Add real-time chain updates

