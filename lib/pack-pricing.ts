/** General-point price is this much higher than the era-point price for era-locked packs. */
export const PACK_GENERAL_PRICE_MULTIPLIER = 1.25;

export const PACK_PAYMENT_METHODS = ["era", "general"] as const;
export type PackPaymentMethod = (typeof PACK_PAYMENT_METHODS)[number];

export type PackPrices = {
  eraPrice: number | null;
  generalPrice: number;
};

export function getPackPrices(
  config: { price: number; eraId: number | null },
  generalMultiplier = PACK_GENERAL_PRICE_MULTIPLIER,
): PackPrices {
  if (config.eraId == null) {
    return { eraPrice: null, generalPrice: config.price };
  }

  return {
    eraPrice: config.price,
    generalPrice: Math.ceil(config.price * generalMultiplier),
  };
}

export function resolvePackPrice(
  config: { price: number; eraId: number | null },
  paymentMethod: PackPaymentMethod,
  generalMultiplier = PACK_GENERAL_PRICE_MULTIPLIER,
): number {
  const prices = getPackPrices(config, generalMultiplier);

  if (config.eraId == null) {
    return prices.generalPrice;
  }

  return paymentMethod === "era" ? prices.eraPrice! : prices.generalPrice;
}

export function defaultPackPaymentMethod(config: { eraId: number | null }): PackPaymentMethod {
  return config.eraId != null ? "era" : "general";
}

export function assertValidPackPaymentMethod(
  config: { eraId: number | null },
  paymentMethod: PackPaymentMethod,
) {
  if (config.eraId == null && paymentMethod === "era") {
    throw new Error("This pack can only be purchased with general points.");
  }
}
