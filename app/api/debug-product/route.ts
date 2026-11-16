// app/api/debug-product/route.ts
import { NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity";

export const dynamic = "force-dynamic";

export async function GET() {
  const id = "rsuy7yqj8qwfv07sww4avu";
  const docs = await sanityClient.fetch(
    `*[_id in [$id, "drafts." + $id]]{_id, _type, name}`,
    { id },
  );
  const products = await sanityClient.fetch(
    `*[_type == "product"][0...5]{_id, name, "slug": slug.current}`,
  );
  return NextResponse.json({ docs, sampleProducts: products });
}