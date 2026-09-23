"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ImagePlus, Trash2 } from "lucide-react";

import {
  adminCreatePaymentMethodAction,
  adminDeletePaymentMethodAction,
  adminUpdatePaymentMethodAction,
} from "@/features/admin/actions";
import type { PaymentMethod } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function QrPreview({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="size-24 rounded-lg border border-white/10 bg-white object-contain p-1"
    />
  );
}

export function AdminPaymentSetupPanel({
  methods,
}: {
  methods: PaymentMethod[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [channel, setChannel] = useState("GCash");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [instructions, setInstructions] = useState("");
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const createQrRef = useRef<HTMLInputElement>(null);
  const rowQrRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function onPickCreateQr(file: File | null) {
    setQrFile(file);
    setQrPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Add payment destination
          </CardTitle>
          <CardDescription>
            Users see these details when settling a bill. OCR reads the receipt
            for amount and transfer reference to auto-confirm payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Channel</Label>
            <Input
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="GCash, Maya, Bank"
            />
          </div>
          <div className="space-y-2">
            <Label>Account name</Label>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Account holder"
            />
          </div>
          <div className="space-y-2">
            <Label>Account number</Label>
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Mobile or account number"
            />
          </div>
          <div className="space-y-2">
            <Label>Instructions (optional)</Label>
            <Input
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Send exact amount…"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>QR code (optional)</Label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={createQrRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => onPickCreateQr(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-lg"
                disabled={pending}
                onClick={() => createQrRef.current?.click()}
              >
                <ImagePlus className="size-3.5" />
                {qrFile ? "Change QR" : "Upload QR"}
              </Button>
              {qrFile && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => {
                    onPickCreateQr(null);
                    if (createQrRef.current) createQrRef.current.value = "";
                  }}
                >
                  Remove
                </button>
              )}
              <QrPreview src={qrPreview} alt="QR preview" />
            </div>
            <p className="text-xs text-muted-foreground">
              PNG or JPG under 2MB. Shown on the settle bill screen.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Button
              disabled={pending}
              className="rounded-xl bg-cyan-400 font-semibold text-black hover:bg-cyan-300"
              onClick={() => {
                startTransition(async () => {
                  const result = await adminCreatePaymentMethodAction({
                    channel,
                    accountName,
                    accountNumber,
                    instructions: instructions || null,
                    qrImage: qrFile,
                  });
                  if (!result.success) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Payment method added");
                  setAccountName("");
                  setAccountNumber("");
                  setInstructions("");
                  onPickCreateQr(null);
                  if (createQrRef.current) createQrRef.current.value = "";
                  router.refresh();
                });
              }}
            >
              Save method
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {methods.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-sm text-muted-foreground">
            No payment methods yet. Add GCash, Maya, or bank details above.
          </div>
        )}
        {methods.map((method) => (
          <div
            key={method.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap gap-4">
                <QrPreview
                  src={method.qr_image_url}
                  alt={`${method.channel} QR`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{method.channel}</p>
                    <Badge
                      variant="outline"
                      className={
                        method.is_active
                          ? "border-teal-400/30 bg-teal-400/10 text-teal-200"
                          : "border-zinc-400/30 bg-zinc-400/10 text-zinc-300"
                      }
                    >
                      {method.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="mt-1 break-all text-sm text-muted-foreground">
                    {method.account_name} · {method.account_number}
                  </p>
                  {method.instructions && (
                    <p className="mt-2 break-words text-xs text-muted-foreground">
                      {method.instructions}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={(el) => {
                    rowQrRefs.current[method.id] = el;
                  }}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    if (!file) return;
                    startTransition(async () => {
                      const result = await adminUpdatePaymentMethodAction({
                        id: method.id,
                        qrImage: file,
                      });
                      if (!result.success) {
                        toast.error(result.error);
                        return;
                      }
                      toast.success("QR updated");
                      router.refresh();
                    });
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  disabled={pending}
                  onClick={() => rowQrRefs.current[method.id]?.click()}
                >
                  <ImagePlus className="size-3.5" />
                  {method.qr_image_url ? "Replace QR" : "Add QR"}
                </Button>
                {method.qr_image_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await adminUpdatePaymentMethodAction({
                          id: method.id,
                          clearQr: true,
                        });
                        if (!result.success) {
                          toast.error(result.error);
                          return;
                        }
                        toast.success("QR removed");
                        router.refresh();
                      });
                    }}
                  >
                    Clear QR
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await adminUpdatePaymentMethodAction({
                        id: method.id,
                        isActive: !method.is_active,
                      });
                      if (!result.success) {
                        toast.error(result.error);
                        return;
                      }
                      toast.success(
                        method.is_active ? "Method disabled" : "Method enabled"
                      );
                      router.refresh();
                    });
                  }}
                >
                  {method.is_active ? "Disable" : "Enable"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg text-rose-300"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await adminDeletePaymentMethodAction(
                        method.id
                      );
                      if (!result.success) {
                        toast.error(result.error);
                        return;
                      }
                      toast.success("Method deleted");
                      router.refresh();
                    });
                  }}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
