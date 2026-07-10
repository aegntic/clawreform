import type { MetadataRoute } from "next";
import { siteBrand } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${siteBrand.baseUrl}/sitemap.xml`,
  };
}
