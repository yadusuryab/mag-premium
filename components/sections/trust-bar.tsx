import { Truck, RotateCcw, ShieldCheck, Headphones } from "lucide-react";

const BADGES = [
  { icon: Truck, title: "Free shipping", desc: "On all orders paid online" },
  { icon: RotateCcw, title: "Easy returns", desc: "Hassle-free returns for damaged or defective items" },
  { icon: ShieldCheck, title: "Secure checkout", desc: "100% protected payments" },
  { icon: Headphones, title: "24h support", desc: "We're here when you need us" },
];

export default function TrustBar() {
  return (
    <section aria-label="Why shop with us" className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-8">
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 rounded-2xl bg-neutral-100 p-6 sm:p-8 md:grid-cols-4">
        {BADGES.map(({ icon: Icon, title, desc }) => (
          <li key={title} className="flex flex-col items-start gap-3">
            <Icon size={28} strokeWidth={1.5} aria-hidden="true" className="text-black" />
            <div>
              <p className="text-base font-medium text-black">{title}</p>
              <p className="mt-1 text-sm text-neutral-500">{desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}