import { NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity";

// Cache the response on the server; Sanity is hit at most once per 5 minutes
export const revalidate = 300;

// Only the fields the Hero uses, max 8 banners, no unused or internal fields
const QUERY = `*[_type == "banner" && active == true] | order(order asc)[0...8] {
  _id,
  title,
  subtitle,
  mediaType,
  "image": image.asset->url,
  "video": video.asset->url,
  "poster": videoPoster.asset->url,
  "label": coalesce(buttonText, ctaText),
  "href": coalesce(buttonLink, ctaLink)
}`;

export async function GET() {
  try {
    const banners = await sanityClient.fetch(QUERY);
    return NextResponse.json(banners, {
      headers: {
        // Browser keeps it 1 min; CDN keeps it 5 min and serves stale for up to 1 hour while refreshing
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch {
    // Generic error: nothing internal is logged to the response, and errors are never cached
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}