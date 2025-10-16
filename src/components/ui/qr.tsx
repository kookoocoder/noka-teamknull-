"use client";

import { useEffect, useRef } from "react";

type QRProps = {
  value: string;
  size?: number;
  className?: string;
};

// Lightweight QR renderer using canvas and dynamic import to avoid server bloat
export function QR({ value, size = 160, className }: QRProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const QRCode = (await import("qrcode")) as any;
      if (!isMounted || !canvasRef.current) return;
      await QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      });
    })();
    return () => {
      isMounted = false;
    };
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      aria-label="QR code"
    />
  );
}


