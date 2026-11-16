// app/api/product/[id]/route.ts
import { NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity";

export const revalidate = 3600;

interface Props {
  params: Promise<{ id: string }>;
}

interface Asset {
  url?: string;
  mimeType?: string;
}

interface RawItem {
  _key?: string;
  alt?: string;
  title?: string;
  asset?: Asset | null;
  hotspot?: unknown;
  videoFile?: { asset?: Asset | null } | null;
  videoUrl?: string;
  poster?: { asset?: Asset | null } | null;
}

interface RawProduct {
  images?: RawItem[] | null;
  [key: string]: unknown;
}

const QUERY = `*[_type == "product" && _id == $id][0]{
  _id, name, price, salesPrice, rating, sizes, colors, features,
  quantity, description, soldOut, featured,
  category->{_id, title},
  images[]{
    _key, alt, title, hotspot,
    asset->{url},
    videoFile{ asset->{url, mimeType} },
    videoUrl,
    poster{ asset->{url} }
  }
}`;

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;

  try {
    const product = await sanityClient.fetch<RawProduct | null>(QUERY, { id });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { images: raw, ...rest } = product;

    // Images and videos live in one array; split them into `media` (new) and `images` (legacy)
    const media = (raw ?? []).flatMap((item:any, i):any => {
      if (item.videoFile || item.videoUrl) {
        return [
          {
            _type: "video" as const,
            _key: item._key ?? `video-${i}`,
            title: item.title ?? "",
            alt: item.alt ?? "",
            videoFile: item.videoFile?.asset
              ? { asset: { url: item.videoFile.asset.url, mimeType: item.videoFile.asset.mimeType } }
              : null,
            videoUrl: item.videoUrl ?? "",
            poster: item.poster?.asset?.url ? { asset: { url: item.poster.asset.url } } : null,
          },
        ];
      }
      if (item.asset?.url) {
        return [
          {
            _type: "image" as const,
            _key: item._key ?? `img-${i}`,
            asset: { url: item.asset.url },
            alt: item.alt ?? "",
            hotspot: item.hotspot ?? null,
          },
        ];
      }
      return [];
    });

    const images = media.flatMap((m:any) => {
      if (m._type === "image") return [{ url: m.asset.url, alt: m.alt }];
      return m.poster ? [{ url: m.poster.asset.url, alt: m.alt || m.title || "Video thumbnail", isVideo: true }] : [];
    });

    return NextResponse.json(
      { ...rest, images, media, hasVideos: media.some((m) => m._type === "video") },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}