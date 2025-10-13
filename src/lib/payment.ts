// Mock payment processing
export async function processPayment(
  orderId: string,
  cardNumber: string,
  expiryDate: string,
  cvv: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock validation - fail if card number ends with 0000
  if (cardNumber.endsWith("0000")) {
    return {
      success: false,
      error: "Payment declined. Please check your card details.",
    };
  }

  // Generate mock transaction ID
  const transactionId = `TXN${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  return {
    success: true,
    transactionId,
  };
}


