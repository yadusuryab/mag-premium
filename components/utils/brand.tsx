import Image from "next/image";
import logo from "@/public/logo.avif";

export default function Brand({ className = "h-9 w-auto" }: { className?: string }) {
  // Static import supplies the real width/height; CSS (h-* w-auto) controls the display size.
  return (
    <Image
      src={logo}
      alt={process.env.NEXT_PUBLIC_APP_NAME || "SHOPIGO"}
      priority
      className={className}
    />
  );
}