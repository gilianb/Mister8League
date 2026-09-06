import "server-only";
import { requireEnv } from "@/lib/env";
import type { BillingData } from "@/lib/db/types";

// Factures Mollie (Sales Invoices API). Le client officiel ne les expose pas,
// on appelle l'API REST directement.

export type MollieSalesInvoiceLine = {
  description: string;
  quantity: number;
  unitPrice: { currency: string; value: string };
  vatRate: string; // "20.00"
};

export type MollieCreateSalesInvoicePayload = {
  status: "draft" | "issued" | "paid";
  recipientIdentifier: string;
  recipient: BillingData;
  lines: MollieSalesInvoiceLine[];
  vatScheme?: "standard" | "one-stop-shop";
  vatMode?: "exclusive" | "inclusive";
  memo?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type MollieSalesInvoice = {
  id: string;
  status?: string;
  invoiceNumber?: string | null;
  _links?: { pdf?: { href?: string }; dashboard?: { href?: string } };
};

async function mollieRequest<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`https://api.mollie.com/v2${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${requireEnv("MOLLIE_API_KEY")}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text().catch(() => "");
  const json = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const detail =
      json && typeof json === "object" && typeof (json as Record<string, unknown>).detail === "string"
        ? ((json as Record<string, unknown>).detail as string)
        : `Mollie error ${res.status}`;
    throw new Error(detail);
  }
  return json as T;
}

export async function mollieCreateSalesInvoice(payload: MollieCreateSalesInvoicePayload): Promise<MollieSalesInvoice> {
  return mollieRequest<MollieSalesInvoice>("/sales-invoices", { method: "POST", body: JSON.stringify(payload) });
}
