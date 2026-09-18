"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  name: string;
  domain?: string;
  logoUrl?: string | null;
  className?: string;
  imgClassName?: string;
};

export function BrandLogo({
  name,
  domain,
  logoUrl,
  className,
  imgClassName,
}: BrandLogoProps) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const src =
    logoUrl ||
    (domain
      ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
      : null);

  return (
    <div
      className={cn(
        "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm",
        className
      )}
    >
      {!src || failed ? (
        <span className="font-display text-xs font-semibold text-zinc-800">
          {initials}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          width={44}
          height={44}
          loading="lazy"
          decoding="async"
          className={cn("size-7 object-contain", imgClassName)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
