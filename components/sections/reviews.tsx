// components/sections/reviews.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import StarRating_Basic from "../commerce-ui/star-rating-basic";
import { focusRing } from "@/components/product/filters";

interface Review {
  name: string;
  instaid?: string;
  review: string;
  rating: number;
}

const reviewSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  phone: z.string().trim().regex(/^\+?[\d\s-]{10,15}$/, "Enter a valid phone number"),
  instaid: z.string().trim().optional(),
  review: z.string().trim().min(5, "Write at least 5 characters"),
  rating: z.number().min(1, "Choose at least 1 star"),
});
type FormData = z.infer<typeof reviewSchema>;
type Errors = Partial<Record<keyof FormData, string>>;

const EMPTY: FormData = { name: "", phone: "", instaid: "", review: "", rating: 0 };
const pill = "h-11 rounded-full px-6 text-sm font-semibold";

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      {children}
      {error && <p id={`${id}-error`} role="alert" className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const [open, setOpen] = useState(false);
  const long = review.review.length > 140;
  return (
    <li className="py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-bold">{review.name}</p>
          {review.instaid && <p className="truncate text-sm font-medium text-neutral-500">@{review.instaid}</p>}
        </div>
        <StarRating_Basic value={review.rating} readOnly iconSize={18} />
      </div>
      <p className={cn("mt-2 whitespace-pre-wrap text-base font-medium text-neutral-600", !open && "line-clamp-2")}>{review.review}</p>
      {long && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={cn("mt-1 rounded-full text-sm font-semibold underline underline-offset-4", focusRing)}
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </li>
  );
}

export default function ProductReviewSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setLoadError(false);
    (async () => {
      try {
        const res = await fetch("/api/get-reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
          signal: ctrl.signal,
        });
        const data: { success: boolean; reviews?: Review[] } = await res.json();
        if (!data.success) throw new Error();
        setReviews(data.reviews ?? []);
      } catch {
        if (!ctrl.signal.aborted) setLoadError(true);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [productId, reloadKey]);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => setForm((f) => ({ ...f, [key]: value }));
  const a11y = (k: keyof FormData) => ({
    id: `rv-${k}`,
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `rv-${k}-error` : undefined,
  });

  const handleSubmit = async () => {
    const parsed = reviewSchema.safeParse(form);
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, v?.[0]])) as Errors);
      return;
    }
    setErrors({});
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/create-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          name: parsed.data.name,
          phone: parsed.data.phone,
          instaId: parsed.data.instaid,
          rating: parsed.data.rating,
          review: parsed.data.review,
        }),
      });
      const data: { success: boolean; message?: string } = await res.json();
      if (!data.success) throw new Error(data.message);
      setForm(EMPTY);
      setDialogOpen(false);
      setReloadKey((k) => k + 1);
    } catch {
      setSubmitError("We couldn’t submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold uppercase leading-none tracking-tight md:text-3xl">Reviews</h2>
          {reviews.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <StarRating_Basic value={Math.round(average)} readOnly iconSize={18} />
              <span className="text-sm font-medium text-neutral-500">
                {average.toFixed(1)} · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </div>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className={cn(pill, "bg-black text-white hover:bg-neutral-700", focusRing)}>Write a review</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90svh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold uppercase tracking-tight">Write a review</DialogTitle>
              <DialogDescription>Your phone number is only used to verify your review and is never shown.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Field id="rv-name" label="Name" error={errors.name}>
                <Input {...a11y("name")} autoComplete="name" className="h-11 rounded-full px-4" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field id="rv-phone" label="Phone number" error={errors.phone}>
                <Input {...a11y("phone")} type="tel" autoComplete="tel" className="h-11 rounded-full px-4" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field id="rv-instaid" label="Instagram ID (optional)">
                <Input id="rv-instaid" className="h-11 rounded-full px-4" value={form.instaid} onChange={(e) => set("instaid", e.target.value.replace(/^@/, ""))} />
              </Field>
              <Field id="rv-review" label="Review" error={errors.review}>
                <Textarea {...a11y("review")} rows={4} className="rounded-2xl px-4 py-3" value={form.review} onChange={(e) => set("review", e.target.value)} />
              </Field>
              <fieldset>
                <legend className="mb-1.5 text-sm font-semibold">Rating</legend>
                <StarRating_Basic value={form.rating} onChange={(v: number) => set("rating", v)} />
                {errors.rating && <p role="alert" className="mt-1.5 text-sm font-medium text-red-600">{errors.rating}</p>}
              </fieldset>

              {submitError && <p role="alert" className="text-sm font-medium text-red-600">{submitError}</p>}

              <Button onClick={handleSubmit} disabled={submitting} className={cn(pill, "w-full bg-black text-white hover:bg-neutral-700", focusRing)}>
                {submitting ? "Submitting…" : "Submit review"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 border-t border-neutral-200" aria-busy={loading}>
        {loading ? (
          <div className="space-y-4 py-5" aria-hidden="true">
            {[0, 1].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 w-32 rounded-full bg-neutral-100" />
                <div className="h-4 w-full rounded-full bg-neutral-100" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div role="alert" className="py-8">
            <p className="text-base font-medium text-neutral-500">Reviews couldn’t be loaded.</p>
            <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={cn("mt-3 rounded-full text-sm font-semibold underline underline-offset-4", focusRing)}>
              Try again
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <p className="py-8 text-base font-medium text-neutral-500">No reviews yet. Be the first to share what you think.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {reviews.map((r, i) => (
              <ReviewItem key={`${r.name}-${i}`} review={r} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}