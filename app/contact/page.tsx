import type { Metadata } from "next";
import {
  ArrowUpRight,
  Instagram,
  Mail,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Order support, questions or just want to say hi. We reply within 24 hours.",
};

type Channel = {
  icon: LucideIcon;
  label: string;
  value: string;
  href: string;
  hint: string;
};

const CHANNELS: Channel[] = [
  {
    icon: Mail,
    label: "Email",
    value: "magshoppy@gmail.com",
    href: "mailto:magshoppy@gmail.com",
    hint: "We reply within 24 hours",
  },
  {
    icon: Phone,
    label: "WhatsApp",
    value: "+91 9656160947",
    href: "https://wa.me/919656160947",
    hint: "Mon to Sat, 9 am to 8 pm IST",
  },
  {
    icon: Instagram,
    label: "Instagram",
    value: "@magshoppy",
    href: "https://instagram.com/magshoppy",
    hint: "DM us anytime",
  },
];

export default function ContactPage() {
  return (
    <section
      aria-labelledby="contact-title"
      className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-8 md:py-16"
    >
      <h1
        id="contact-title"
        className="text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl md:text-7xl"
      >
        Get in touch
      </h1>
      <p className="mt-4 max-w-md text-base font-medium text-neutral-500">
        Questions, order support or just want to say hi. We reply fast.
      </p>

      <div className="mt-10 grid gap-10 md:mt-14 md:grid-cols-2 md:gap-16">
        <ul className="self-start border-t border-neutral-200">
          {CHANNELS.map(({ icon: Icon, label, value, href, hint }) => {
            const external = href.startsWith("http");
            return (
              <li key={label} className="border-b border-neutral-200">
                <a
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="group flex items-center gap-4 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                    <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block truncate text-base font-medium">
                      {value}
                    </span>
                    <span className="block text-sm font-medium text-neutral-500">
                      {hint}
                    </span>
                  </span>
                  <ArrowUpRight
                    className="ml-auto h-6 w-6 shrink-0 text-neutral-400 transition-colors group-hover:text-black"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  {external && (
                    <span className="sr-only">(opens in new tab)</span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>

        <ContactForm />
      </div>
    </section>
  );
}
