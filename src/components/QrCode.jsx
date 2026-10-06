export default function QrCode({ value, size = 200 }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&color=1C1917&bgcolor=FAFAF9&data=${encodeURIComponent(value)}`;
  return (
    <div className="bg-background border border-border p-4 rounded-sm inline-flex">
      <img src={src} width={size} height={size} alt="Quiz QR code" className="block" />
    </div>
  );
}