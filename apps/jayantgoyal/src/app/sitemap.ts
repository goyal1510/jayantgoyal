import type { MetadataRoute } from "next"

const BASE_URL = "https://www.jayantgoyal.com"

// Last modified date — update when deploying significant changes
const LAST_MODIFIED = "2026-06-19T00:00:00.000Z"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publicPages = [
    { url: BASE_URL, lastModified: LAST_MODIFIED, changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${BASE_URL}/tools`, lastModified: LAST_MODIFIED, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/weather`, lastModified: LAST_MODIFIED, changeFrequency: "daily" as const, priority: 0.6 },
    { url: `${BASE_URL}/custom-calculator`, lastModified: LAST_MODIFIED, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE_URL}/terms-conditions`, lastModified: LAST_MODIFIED, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${BASE_URL}/github-stats`, lastModified: LAST_MODIFIED, changeFrequency: "daily" as const, priority: 0.5 },
  ]

  const tools = [
    "generators/uuid-generator", "generators/token-generator", "generators/otp-generator",
    "generators/bip39-generator", "generators/ulid-generator", "generators/mac-generator",
    "generators/rsa-key-generator", "generators/random-port-generator", "generators/ipv6-ula-generator",
    "converters/json-to-yaml", "converters/yaml-to-json", "converters/xml-to-json",
    "converters/json-to-xml", "converters/json-to-toml", "converters/toml-to-json",
    "converters/yaml-to-toml", "converters/toml-to-yaml", "converters/base64-encoder-decoder",
    "converters/base64-file-converter", "converters/integer-base-converter",
    "converters/date-time-converter", "converters/temperature-converter",
    "converters/roman-numeral-converter", "converters/color-converter",
    "formatters/json-prettify", "formatters/json-minify", "formatters/xml-formatter",
    "formatters/yaml-prettify", "formatters/sql-prettify",
    "hash-encryption/hash-text", "hash-encryption/hmac-generator", "hash-encryption/bcrypt",
    "hash-encryption/encrypt-decrypt", "hash-encryption/password-strength",
    "text-tools/case-converter", "text-tools/lorem-ipsum-generator", "text-tools/text-diff",
    "text-tools/text-statistics", "text-tools/slugify-string", "text-tools/string-obfuscator",
    "text-tools/text-to-unicode", "text-tools/text-to-ascii-binary", "text-tools/text-to-nato",
    "text-tools/list-converter", "text-tools/numeronym-generator", "text-tools/ascii-art-generator",
    "parsers-validators/jwt-parser", "parsers-validators/url-parser",
    "parsers-validators/user-agent-parser", "parsers-validators/email-normalizer",
    "parsers-validators/phone-parser", "parsers-validators/iban-validator",
    "parsers-validators/pdf-signature-checker",
    "code-dev-tools/regex-tester", "code-dev-tools/regex-cheatsheet",
    "code-dev-tools/git-cheatsheet", "code-dev-tools/http-status-codes",
    "code-dev-tools/crontab-generator", "code-dev-tools/chmod-calculator",
    "code-dev-tools/keycode-info", "code-dev-tools/docker-converter", "code-dev-tools/json-diff",
    "network-tools/ipv4-subnet-calculator", "network-tools/ipv4-address-converter",
    "network-tools/ipv4-range-expander", "network-tools/mac-address-lookup",
    "media-qr/qr-code-generator", "media-qr/wifi-qr-code-generator",
    "media-qr/svg-placeholder-generator", "media-qr/camera-recorder",
    "calculators/math-evaluator", "calculators/percentage-calculator",
    "calculators/eta-calculator", "calculators/chronometer",
    "other/url-encoder-decoder", "other/html-entities", "other/markdown-to-html",
    "other/json-to-csv", "other/basic-auth-generator", "other/open-graph-generator",
    "other/emoji-picker", "other/device-information", "other/benchmark-builder",
    "other/html-wysiwyg-editor", "other/outlook-safelink-decoder", "other/mime-types",
    "other/personal-information-form",
  ]

  const toolPages = tools.map((tool) => ({
    url: `${BASE_URL}/tools/${tool}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))


  const blogPages: MetadataRoute.Sitemap = []
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (supabaseUrl && supabaseKey) {
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: posts } = await supabase
      .schema("jg_app")
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("is_published", true)
      .eq("is_visible", true)
    if (posts) {
      blogPages.push(
        { url: `${BASE_URL}/blogs`, lastModified: LAST_MODIFIED, changeFrequency: "weekly", priority: 0.8 },
        ...posts.map((p) => ({
          url: `${BASE_URL}/blog/${p.slug}`,
          lastModified: p.updated_at,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }))
      )
    }
  }

  return [...publicPages, ...toolPages, ...blogPages]
}
