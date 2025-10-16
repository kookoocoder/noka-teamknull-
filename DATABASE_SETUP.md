# Database Setup & Verification Guide

## Current Configuration

### Database Provider: PostgreSQL
- **Connection**: `db.prisma.io:5432`
- **Database**: `postgres`
- **Status**: Connection failing (external database)

### Fixed Issues ✅
1. **Better Auth Adapter**: Changed from `sqlite` to `postgresql` in `src/lib/auth.ts`
2. **Schema Fields**: Made `publicHashId` and `productHashId` optional
3. **Build**: All TypeScript errors resolved

---

## Option 1: Use Your PostgreSQL Database (Current Setup)

If your PostgreSQL database at `db.prisma.io:5432` is accessible:

### Step 1: Verify Connection
```bash
# Test if database is reachable
bun run db:push
```

If connection works:
```bash
# Push schema to create tables
bun run db:push

# Seed with test data
bun run db:seed

# Start development
bun run dev
```

### Troubleshooting PostgreSQL Connection

If connection fails:

1. **Check Database Status**
   - Ensure PostgreSQL server is running
   - Verify firewall allows port 5432
   - Check if database requires VPN/whitelist

2. **Verify Credentials**
   - Database URL in `.env` is correct
   - User has CREATE TABLE permissions
   - SSL mode is properly configured

---

## Option 2: Use Local SQLite (Recommended for Development)

For quick local development without external database:

### Step 1: Update `.env`
```bash
# Change DATABASE_URL to SQLite
DATABASE_URL="file:./prisma/local.db"
```

### Step 2: Update Better Auth Adapter
Already fixed! ✅ (Changed to `postgresql`, will work with SQLite too)

Actually, SQLite needs `"sqlite"` provider. Let me check your current setup preference first.

### Step 3: Push Schema & Seed
```bash
bun run prisma:generate
bun run db:push
bun run db:seed
bun run dev
```

---

## Option 3: Use Supabase (Free PostgreSQL)

If you want a free cloud PostgreSQL database:

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string

### Step 2: Update `.env`
```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### Step 3: Run Migrations
```bash
bun run db:push
bun run db:seed
bun run dev
```

---

## Current Database Schema

### Provenance Tables (Added)

```sql
-- User public hash IDs (optional, auto-generated)
ALTER TABLE "user" ADD COLUMN "publicHashId" TEXT UNIQUE;

-- Product hash IDs (optional, auto-generated)
ALTER TABLE "produce_listing" ADD COLUMN "productHashId" TEXT UNIQUE;

-- Provenance event types
CREATE TYPE "ProvenanceEventType" AS ENUM (
  'ORDER_CREATED',
  'PAYMENT_CONFIRMED', 
  'ORDER_ACCEPTED',
  'SHIPMENT_CREATED',
  'SHIPMENT_STATUS_UPDATED',
  'STORAGE_LOGGED',
  'DELIVERED'
);

-- Provenance chain per order
CREATE TABLE "ProvenanceChain" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT UNIQUE NOT NULL,
  "lastHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE
);

-- Individual events in chain
CREATE TABLE "provenance_event" (
  "id" TEXT PRIMARY KEY,
  "chainId" TEXT NOT NULL,
  "index" INTEGER NOT NULL,
  "type" "ProvenanceEventType" NOT NULL,
  "actorId" TEXT NOT NULL,
  "prevHash" TEXT NOT NULL,
  "hash" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("chainId") REFERENCES "ProvenanceChain"("id") ON DELETE CASCADE,
  UNIQUE ("chainId", "index")
);
```

---

## Verification Checklist

### After Database Setup

- [ ] **Connection Test**: `bun run db:push` succeeds
- [ ] **Tables Created**: All provenance tables exist
- [ ] **Seed Data**: Test users and products loaded
- [ ] **Dev Server**: `bun run dev` starts without errors
- [ ] **User Signup**: Can create new account at `/auth`
- [ ] **Product Listing**: Farmer can create produce
- [ ] **Order Flow**: Buyer can place order
- [ ] **Provenance Chain**: Chain created on order
- [ ] **Scan Page**: Can view at `/scan/[orderId]`

---

## Quick Test Commands

### 1. Test Database Connection
```bash
bun run db:push
```
**Expected**: ✅ Schema applied successfully

### 2. Check Tables
```bash
# If using SQLite
sqlite3 prisma/local.db ".tables"

# If using PostgreSQL
# Use your DB client to verify tables
```

### 3. Seed Test Data
```bash
bun run db:seed
```
**Expected**: ✅ Users, products, hash IDs created

### 4. Start & Test
```bash
bun run dev
```

Then test:
1. Open http://localhost:3000/auth
2. Sign up with new account
3. If farmer: create produce listing
4. If buyer: place order
5. Complete payment
6. Farmer accepts order
7. View provenance at `/scan/[orderId]`

---

## Blockchain Provenance Features

### How It Works with Frontend

1. **User Signup** (Frontend: `/auth`)
   - User creates account
   - `publicHashId` is `null` initially
   - Generated on-demand when needed

2. **Create Product** (Frontend: `/produce/new`)
   - Farmer lists produce
   - `productHashId` auto-generated
   - Action: `src/app/actions/produce.ts`

3. **Place Order** (Frontend: `/marketplace`)
   - Buyer places order
   - **Genesis Event** created: `ORDER_CREATED`
   - Hash IDs generated for farmer/buyer/product
   - Action: `src/app/actions/orders.ts`

4. **Payment** (Frontend: `/orders/[id]/payment`)
   - Buyer pays
   - Event appended: `PAYMENT_CONFIRMED`
   - Action: `src/app/actions/payment.ts`

5. **Accept Order** (Frontend: `/dashboard/farmer`)
   - Farmer accepts
   - Event appended: `ORDER_ACCEPTED`
   - Action: `src/app/actions/orders.ts`

6. **Assign Transporter** (Frontend: `/dashboard/transporter`)
   - Transporter accepts job
   - Event appended: `SHIPMENT_CREATED`
   - Transporter hash ID generated
   - Action: `src/app/actions/transporters.ts`

7. **Update Status** (Frontend: `/jobs/[id]`)
   - Transporter updates location/status
   - Event appended: `SHIPMENT_STATUS_UPDATED`
   - Action: `src/app/actions/shipments.ts`

8. **Log Storage** (Frontend: `/shipments/[id]/log-storage`)
   - Log temperature/humidity
   - Event appended: `STORAGE_LOGGED`
   - Action: `src/app/actions/storage.ts`

9. **Delivery** (Frontend: `/jobs/[id]`)
   - Mark as delivered
   - Event appended: `DELIVERED`
   - Action: `src/app/actions/shipments.ts`

10. **View Provenance** (Frontend: `/scan/[orderId]`)
    - **Public page** (no login)
    - Shows complete chain
    - Verifies cryptographic integrity
    - Displays all stakeholders

---

## Frontend Integration Points

### Components Using Provenance

1. **`/src/app/orders/[id]/page.tsx`**
   - Shows "View Provenance Chain" button
   - Links to `/scan/[orderId]`

2. **`/src/app/scan/[orderId]/page.tsx`**
   - Public scanner page
   - Fetches chain via `getChain()`
   - Shows verification status
   - Displays timeline

3. **`/src/components/provenance-timeline.tsx`**
   - Visual timeline component
   - Event-specific rendering
   - Shows hashes & technical details

### Server Actions Integration

All integrated! Events auto-emit from:
- ✅ `orders.ts` - Order creation, acceptance
- ✅ `payment.ts` - Payment confirmation  
- ✅ `transporters.ts` - Transporter assignment
- ✅ `shipments.ts` - Status updates, delivery
- ✅ `storage.ts` - Storage condition logs
- ✅ `produce.ts` - Product hash generation

---

## Current Status

### ✅ Implemented
- [x] Database schema with provenance models
- [x] Hash generation (SHA-256)
- [x] Event chain creation
- [x] Cryptographic verification
- [x] Public scan UI
- [x] Timeline visualization
- [x] Auto-event emission
- [x] On-demand hash ID generation

### ⚠️ Pending
- [ ] Database connection (external PostgreSQL unreachable)
- [ ] Choose database option (PostgreSQL/SQLite/Supabase)
- [ ] Run migrations (`db:push`)
- [ ] Seed test data (`db:seed`)

---

## Recommended Next Steps

### For Quick Testing (5 minutes)

1. **Switch to SQLite** (Easiest):
   ```bash
   # Update .env
   DATABASE_URL="file:./prisma/local.db"
   
   # Update src/lib/auth.ts provider to "sqlite"
   
   # Run migrations
   bun run prisma:generate
   bun run db:push
   bun run db:seed
   bun run dev
   ```

2. **Test the Flow**:
   - Sign up → Create produce → Place order → Pay → Accept → Assign → Deliver
   - View provenance at `/scan/[orderId]`

### For Production (Recommended)

1. **Use Supabase**:
   - Free PostgreSQL database
   - Already configured for PostgreSQL
   - Just update `DATABASE_URL` in `.env`
   - Run `bun run db:push` and `bun run db:seed`

---

## Support

**Database Issues?**
- Check `.env` file DATABASE_URL
- Verify database is running
- Check Better Auth provider matches database type
- See FIXES_APPLIED.md for common errors

**Provenance Issues?**
- Check PROVENANCE_IMPLEMENTATION.md for technical details
- See MIGRATION_GUIDE.md for setup steps
- Verify all server actions are integrated

**Build Issues?**
- Run `bun run build` to check TypeScript
- All current code is error-free ✅

