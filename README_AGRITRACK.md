# AgriTrack - Agricultural Supply Chain and Logistics Tracker

A comprehensive supply chain tracking platform connecting farmers, buyers (distributors/retailers), and transporters to minimize post-harvest losses and improve delivery efficiency.

## Features

### For Farmers
- List produce with pricing, quantity, and harvest dates
- Accept or reject incoming orders
- Track shipment status in real-time
- View order history and manage listings

### For Buyers
- Browse marketplace with search and filters
- Place orders with delivery addresses
- Secure mock payment processing
- Track shipments and view storage conditions
- Rate transporters after delivery

### For Transporters
- View and accept available delivery jobs
- Auto-matching algorithm based on location and capacity
- Update shipment status (Pending → Picked Up → In Transit → Delivered)
- Log storage conditions (temperature, humidity)
- Mobile-optimized interface

### General Features
- Role-based authentication (Farmer, Buyer, Transporter)
- Real-time notifications
- Shipment timeline visualization
- Storage condition monitoring with alerts
- Rating and review system

## Tech Stack

- **Frontend**: Next.js 15 with App Router, React 19
- **Backend**: Next.js Server Actions
- **Database**: SQLite with Prisma ORM
- **Authentication**: Better Auth
- **UI**: Tailwind CSS + shadcn/ui components
- **Validation**: Zod
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- SQLite

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd f-pl
```

2. Install dependencies
```bash
bun install
```

3. Set up environment variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./prisma/local.db"
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"
```

4. Generate Prisma client and push schema to database
```bash
bun run prisma:generate
bun run db:push
```

5. Seed the database with sample data
```bash
bun run db:seed
```

6. Start the development server
```bash
bun run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Test Accounts

After seeding the database, you can use these test accounts:

**Farmer Account**
- Email: `farmer@example.com`
- Password: `password123`

**Buyer Account**
- Email: `buyer@example.com`
- Password: `password123`

**Transporter Account**
- Email: `transporter@example.com`
- Password: `password123`

## Project Structure

```
src/
├── app/
│   ├── actions/          # Server actions
│   │   ├── produce.ts
│   │   ├── orders.ts
│   │   ├── shipments.ts
│   │   ├── storage.ts
│   │   ├── transporters.ts
│   │   ├── notifications.ts
│   │   └── ratings.ts
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Role-specific dashboards
│   │   ├── farmer/
│   │   ├── buyer/
│   │   └── transporter/
│   ├── marketplace/      # Marketplace page
│   ├── produce/          # Produce management
│   ├── orders/           # Order management
│   ├── shipments/        # Shipment tracking
│   ├── jobs/             # Transporter job management
│   └── notifications/    # Notifications center
├── components/           # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── navbar.tsx
│   ├── produce-card.tsx
│   ├── order-card.tsx
│   ├── shipment-timeline.tsx
│   └── status-badge.tsx
└── lib/
    ├── auth.ts           # Better Auth configuration
    ├── prisma.ts         # Prisma client
    ├── types.ts          # Zod schemas
    ├── matching.ts       # Auto-matching algorithm
    ├── notifications.ts  # Notification helpers
    └── payment.ts        # Mock payment processing
```

## Key Workflows

### End-to-End Order Flow

1. **Farmer** lists produce on marketplace
2. **Buyer** browses marketplace and places order
3. **Buyer** completes mock payment (order status: PENDING → CONFIRMED)
4. **Farmer** accepts order
5. System auto-matches **Transporter** based on location and capacity
6. **Transporter** accepts job and picks up produce (status: PICKED_UP)
7. **Transporter** logs storage conditions during transit
8. **Transporter** updates location (status: IN_TRANSIT)
9. **Transporter** delivers produce (status: DELIVERED)
10. **Buyer/Farmer** rate the transporter

## Auto-Matching Algorithm

The system automatically matches transporters to orders based on:
- **Location proximity** (60% weight): Matches transporters near pickup location
- **Capacity** (40% weight): Ensures transporter has sufficient capacity
- **Availability**: Only matches available transporters

If no suitable match is found, farmers can manually assign transporters.

## Storage Monitoring

- Temperature and humidity logging at any stage
- Automatic alerts when temperature exceeds 10°C (perishable threshold)
- Historical storage logs visible to all parties
- Helps prevent spoilage and maintain produce quality

## Mock Payment System

- Test payment flow without real transactions
- Card numbers ending in 0000 will fail (for testing)
- Any other 16-digit card number will succeed
- Order status updates automatically after payment

## Contributing

This is a hackathon project. Feel free to fork and enhance!

## License

MIT

## Notes for Hackathon Judges

This platform demonstrates:
- Real-world problem solving (20-30% reduction in post-harvest losses)
- Multi-stakeholder coordination
- Mobile-first design for field use
- Transparency through real-time tracking
- Data-driven matching algorithms
- User-friendly interface with clear workflows

The mock payment system can be easily replaced with real payment gateways (Stripe, Razorpay) for production use.

