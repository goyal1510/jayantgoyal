import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/welcome"],
        disallow: [
          "/account/",
          "/api/",
          "/auth/callback",
          "/callback",
          "/error",
          "/forgot-password",
          "/login",
          "/logout",
          "/mfa",
          "/register",
          "/reset-password",
          "/verify",
        ],
      },
    ],
  };
}
