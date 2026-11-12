export type PendingExpenseImage = {
  id: string;
  src: string;
  name: string;
  alt: string;
};

export type PendingExpenseInput =
  | { kind: "text"; description: string }
  | {
      kind: "images";
      images: readonly [PendingExpenseImage, ...PendingExpenseImage[]];
      description?: string;
    };

export const defaultPendingInput: PendingExpenseInput = {
  kind: "text",
  description: "Lunch at Godt Brød, 185 kr",
};

const lunchReceipt: PendingExpenseImage = {
  id: "lunch",
  src: "/demo-receipts/lunch-receipt.svg",
  name: "lunch-receipt.jpg",
  alt: "Sample receipt for lunch at Godt Brød, 185 kr",
};

const coffeeReceipt: PendingExpenseImage = {
  id: "coffee",
  src: "/demo-receipts/coffee-receipt.svg",
  name: "coffee-receipt.jpg",
  alt: "Sample receipt for coffee and a pastry, 74 kr",
};

export const singlePhotoInput: PendingExpenseInput = {
  kind: "images",
  images: [lunchReceipt],
};

export const pendingImageExamples: {
  label: string;
  input: PendingExpenseInput;
}[] = [
  { label: "One photo", input: singlePhotoInput },
  {
    label: "Two photos",
    input: { kind: "images", images: [lunchReceipt, coffeeReceipt] },
  },
  {
    label: "Photo + note",
    input: {
      kind: "images",
      images: [lunchReceipt],
      description: "Lunch with the team. Add to Everyday.",
    },
  },
];
