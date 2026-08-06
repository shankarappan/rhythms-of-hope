export const MERCH_PRICE_CENTS = 3500;
export const MERCH_MAX_ITEMS = 20;
export const MERCH_PICKUP = "Te Whare Maui Event Centre, 21 Maui Street, Pukete, Hamilton 3200";

export const merchAudiences = ["adult", "kids"] as const;
export const merchColours = ["black", "white"] as const;
export const merchSizes = ["XS", "S", "M", "L", "XL"] as const;

export type MerchAudience = (typeof merchAudiences)[number];
export type MerchColour = (typeof merchColours)[number];
export type MerchSize = (typeof merchSizes)[number];
export type MerchCartItem = {
  audience: MerchAudience;
  colour: MerchColour;
  size: MerchSize;
  quantity: number;
};

export function parseMerchCart(value: unknown): MerchCartItem[] {
  if (!Array.isArray(value)) throw new Error("Your bag is empty.");
  const merged = new Map<string, MerchCartItem>();
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") throw new Error("A product selection is invalid.");
    const item = candidate as Partial<MerchCartItem>;
    if (!merchAudiences.includes(item.audience as MerchAudience) ||
        !merchColours.includes(item.colour as MerchColour) ||
        !merchSizes.includes(item.size as MerchSize) ||
        !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 10) {
      throw new Error("A product selection is invalid.");
    }
    const key = `${item.audience}:${item.colour}:${item.size}`;
    const previous = merged.get(key);
    merged.set(key, {
      audience: item.audience as MerchAudience,
      colour: item.colour as MerchColour,
      size: item.size as MerchSize,
      quantity: (previous?.quantity ?? 0) + Number(item.quantity),
    });
  }
  const items = [...merged.values()];
  const total = items.reduce((sum, item) => sum + item.quantity, 0);
  if (!items.length || total > MERCH_MAX_ITEMS) throw new Error(`Choose between 1 and ${MERCH_MAX_ITEMS} shirts.`);
  return items;
}

export function encodeMerchCart(items: MerchCartItem[]) {
  return items.map(item => `${item.audience}:${item.colour}:${item.size}:${item.quantity}`).join(",");
}

export function decodeMerchCart(value: string | undefined) {
  if (!value) throw new Error("The merchandise order details are missing.");
  return parseMerchCart(value.split(",").map(entry => {
    const [audience, colour, size, quantity] = entry.split(":");
    return { audience, colour, size, quantity: Number(quantity) };
  }));
}

export function merchItemName(item: MerchCartItem) {
  return `HOPE T-shirt — ${item.audience === "adult" ? "Adult" : "Kids"}, ${item.colour[0].toUpperCase()}${item.colour.slice(1)}, ${item.size}`;
}
