import { z } from "zod";
import type { UserRole, ProduceStatus, OrderStatus, ShipmentStatus } from "@/generated/prisma";

export const SignUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  passwordConfirmation: z.string().min(1, "Please confirm your password"),
  role: z.enum(["FARMER", "BUYER", "TRANSPORTER"]),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Passwords don't match",
  path: ["passwordConfirmation"],
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const OnboardingSchema = z.object({
  phone: z.string().min(10, "Phone number is required"),
  location: z.string().min(1, "Location is required"),
  address: z.string().min(1, "Address is required"),
  // Transporter-specific fields
  vehicleType: z.string().nullable().optional(),
  maxCapacity: z.number().positive().nullable().optional(),
});

export const ProduceListingSchema = z.object({
  cropType: z.string().min(1, "Crop type is required"),
  quantity: z.number().positive("Quantity must be positive"),
  pricePerKg: z.number().positive("Price must be positive"),
  harvestDate: z.date(),
  location: z.string().min(1, "Location is required"),
  description: z.string().optional(),
  images: z.string().optional(),
});

export const OrderSchema = z.object({
  listingId: z.string().uuid(),
  quantity: z.number().positive("Quantity must be positive"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  notes: z.string().optional(),
});

export const StorageLogSchema = z.object({
  shipmentId: z.string().uuid(),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  notes: z.string().optional(),
});

export const RatingSchema = z.object({
  toUserId: z.string().uuid(),
  shipmentId: z.string().uuid(),
  score: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const PaymentSchema = z.object({
  orderId: z.string().uuid(),
  cardNumber: z.string().min(16).max(16),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/),
  cvv: z.string().min(3).max(3),
});