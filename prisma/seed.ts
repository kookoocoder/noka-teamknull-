import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Create users
  const farmer = await prisma.user.upsert({
    where: { email: "farmer@example.com" },
    update: {},
    create: {
      email: "farmer@example.com",
      name: "John Farmer",
      emailVerified: true,
      role: "FARMER",
      phone: "+91 9876543210",
      location: "Delhi",
      address: "123 Farm Lane, Delhi",
      accounts: {
        create: {
          id: "farmer-account",
          accountId: "farmer",
          providerId: "credential",
          password: "$2a$10$rZ2gQs7qJ4Kq3K.hXy6ySeUHgQJzBqYvVqZ9gQJzBqYvVqZ9gQ", // "password123"
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@example.com" },
    update: {},
    create: {
      email: "buyer@example.com",
      name: "Sarah Buyer",
      emailVerified: true,
      role: "BUYER",
      phone: "+91 9876543211",
      location: "Mumbai",
      address: "456 Market Street, Mumbai",
      accounts: {
        create: {
          id: "buyer-account",
          accountId: "buyer",
          providerId: "credential",
          password: "$2a$10$rZ2gQs7qJ4Kq3K.hXy6ySeUHgQJzBqYvVqZ9gQJzBqYvVqZ9gQ", // "password123"
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
  });

  const transporter = await prisma.user.upsert({
    where: { email: "transporter@example.com" },
    update: {},
    create: {
      email: "transporter@example.com",
      name: "Mike Transporter",
      emailVerified: true,
      role: "TRANSPORTER",
      phone: "+91 9876543212",
      location: "Delhi",
      address: "789 Highway Road, Delhi",
      accounts: {
        create: {
          id: "transporter-account",
          accountId: "transporter",
          providerId: "credential",
          password: "$2a$10$rZ2gQs7qJ4Kq3K.hXy6ySeUHgQJzBqYvVqZ9gQJzBqYvVqZ9gQ", // "password123"
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
  });

  // Create transporter profile
  await prisma.transporterProfile.upsert({
    where: { userId: transporter.id },
    update: {},
    create: {
      userId: transporter.id,
      vehicleType: "Refrigerated Truck",
      maxCapacity: 1000,
      currentLocation: "Delhi",
      isAvailable: true,
    },
  });

  // Create produce listings
  const tomatoListing = await prisma.produceListing.create({
    data: {
      farmerId: farmer.id,
      cropType: "Tomatoes",
      quantity: 500,
      pricePerKg: 30,
      harvestDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      location: "Delhi",
      description: "Fresh, organic tomatoes. High quality produce perfect for wholesale.",
      status: "AVAILABLE",
    },
  });

  const wheatListing = await prisma.produceListing.create({
    data: {
      farmerId: farmer.id,
      cropType: "Wheat",
      quantity: 1000,
      pricePerKg: 25,
      harvestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      location: "Delhi",
      description: "Premium quality wheat grains.",
      status: "AVAILABLE",
    },
  });

  const riceListing = await prisma.produceListing.create({
    data: {
      farmerId: farmer.id,
      cropType: "Basmati Rice",
      quantity: 750,
      pricePerKg: 60,
      harvestDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      location: "Delhi",
      description: "Premium Basmati rice, aromatic and long grain.",
      status: "AVAILABLE",
    },
  });

  console.log("Seed completed successfully!");
  console.log("\nTest Accounts:");
  console.log("==============");
  console.log("Farmer:");
  console.log("  Email: farmer@example.com");
  console.log("  Password: password123");
  console.log("\nBuyer:");
  console.log("  Email: buyer@example.com");
  console.log("  Password: password123");
  console.log("\nTransporter:");
  console.log("  Email: transporter@example.com");
  console.log("  Password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

