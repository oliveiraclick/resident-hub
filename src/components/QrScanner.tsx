import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

const QrScanner = ({ onScan, onError }: QrScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const elementId = "qr-reader-" + Math.random().toString(36).slice(2);

    if (containerRef.current) {
      containerRef.current.id = elementId;
    }

    const scanner = new Html5Qrcode(elementId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          scanner.stop().catch(() => {});
        },
        () => {}
      )
      .then(() => setStarted(true))
      .catch((err) => {
        onError?.(err?.message || "Erro ao acessar câmera");
      });

    return () => {
      if (scannerRef.current && started) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div
        ref={containerRef}
        className="rounded-card overflow-hidden border border-border"
      />
    </div>
  );
};

export default QrScanner;
