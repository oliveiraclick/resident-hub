import { QRCodeSVG } from "qrcode.react";

interface QrDisplayProps {
  value: string;
  size?: number;
  label?: string;
}

const QrDisplay = ({ value, size = 200, label }: QrDisplayProps) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-card border border-border bg-card p-4">
        <QRCodeSVG value={value} size={size} />
      </div>
      {label && <p className="text-subtitle text-muted-foreground">{label}</p>}
    </div>
  );
};

export default QrDisplay;
