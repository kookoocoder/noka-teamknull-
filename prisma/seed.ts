import { PrismaClient } from "../src/generated/prisma";
import { generateUniqueHashId } from "../src/lib/provenance";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Generate hash IDs
  const farmerHashId = await generateUniqueHashId("USER", "farmer@example.com");
  const buyerHashId = await generateUniqueHashId("USER", "buyer@example.com");
  const transporterHashId = await generateUniqueHashId("USER", "transporter@example.com");

  // Create users with hash IDs
  const farmer = await prisma.user.upsert({
    where: { email: "farmer@example.com" },
    update: {
      publicHashId: farmerHashId,
    },
    create: {
      email: "farmer@example.com",
      name: "John Farmer",
      emailVerified: true,
      role: "FARMER",
      phone: "+91 9876543210",
      location: "Delhi",
      address: "123 Farm Lane, Delhi",
      publicHashId: farmerHashId,
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
    update: {
      publicHashId: buyerHashId,
    },
    create: {
      email: "buyer@example.com",
      name: "Sarah Buyer",
      emailVerified: true,
      role: "BUYER",
      phone: "+91 9876543211",
      location: "Mumbai",
      address: "456 Market Street, Mumbai",
      publicHashId: buyerHashId,
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
    update: {
      publicHashId: transporterHashId,
    },
    create: {
      email: "transporter@example.com",
      name: "Mike Transporter",
      emailVerified: true,
      role: "TRANSPORTER",
      phone: "+91 9876543212",
      location: "Delhi",
      address: "789 Highway Road, Delhi",
      publicHashId: transporterHashId,
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

  // Create produce listings with product hash IDs
  const tomatoHashId = await generateUniqueHashId("PRODUCT", `Tomatoes:${farmer.id}`);
  const wheatHashId = await generateUniqueHashId("PRODUCT", `Wheat:${farmer.id}`);
  const riceHashId = await generateUniqueHashId("PRODUCT", `Basmati Rice:${farmer.id}`);

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
      productHashId: tomatoHashId,
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
      productHashId: wheatHashId,
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
      productHashId: riceHashId,
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

