import { InterswitchProvider } from "./interswitch.provider.js";
import { PaystackProvider } from "./paystack.provider.js";

export function createPaymentProvider(method) {
  if (!method || !method.provider) {
    throw new Error("Payment provider is not defined");
  }

  const provider = String(method.provider).toUpperCase();
  if (provider === "INTERSWITCH") {
    return new InterswitchProvider(method);
  }
  if (provider === "PAYSTACK") {
    return new PaystackProvider(method);
  }
  throw new Error(`Unsupported payment provider: ${method.provider}`);
}
