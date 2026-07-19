"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";

import { EditorialSubpageHeader } from "@/components/editorial/subpage-header";
import { formatEditorialDate } from "@/lib/blog/date";
import type {
  PortfolioNavigationItem,
  PortfolioSectionContent,
} from "@/lib/portfolio/editorial-data";
import type { BlogListPost, BlogPost } from "@/lib/blog/queries";

type NextPost = Pick<
  BlogListPost,
  "title" | "slug" | "excerpt" | "published_at"
>;

type ArticleSection = {
  id: string;
  label: string;
};

function headingText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(headingText).join("");
  }

  if (
    children &&
    typeof children === "object" &&
    "props" in children &&
    typeof children.props === "object" &&
    children.props &&
    "children" in children.props
  ) {
    return headingText(children.props.children as ReactNode);
  }

  return "";
}

function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function prepareArticleContent(content: string, title: string): string {
  const lines = content.trimStart().split("\n");
  const firstLine = lines[0]?.trim() ?? "";
  const markdownTitle = firstLine.replace(/^#\s+/, "").trim();

  if (
    firstLine.startsWith("# ") &&
    normalizeTitle(markdownTitle) === normalizeTitle(title)
  ) {
    return lines.slice(1).join("\n").trimStart();
  }

  return content;
}

function extractSections(content: string): ArticleSection[] {
  return Array.from(content.matchAll(/^##\s+(.+)$/gm), (match) => {
    const label = match[1]?.replace(/[*_`]/g, "").trim() ?? "Section";
    return { id: slugifyHeading(label), label };
  });
}

const markdownComponents: Components = {
  h1: ({ children }) => {
    const label = headingText(children);
    return <h2 id={slugifyHeading(label)}>{children}</h2>;
  },
  h2: ({ children }) => {
    const label = headingText(children);
    return <h2 id={slugifyHeading(label)}>{children}</h2>;
  },
  h3: ({ children }) => {
    const label = headingText(children);
    return <h3 id={slugifyHeading(label)}>{children}</h3>;
  },
  h4: ({ children }) => <h4>{children}</h4>,
  p: ({ children }) => <p>{children}</p>,
  a: ({ href, children }) => {
    const isExternal = href?.startsWith("http");
    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  },
  ul: ({ children }) => <ul>{children}</ul>,
  ol: ({ children }) => <ol>{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => <blockquote>{children}</blockquote>,
  code: ({ children, className }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code>{children}</code>
    ),
  pre: ({ children }) => <pre>{children}</pre>,
  hr: () => <hr />,
  img: ({ src, alt }) => <img src={src} alt={alt ?? ""} />,
  table: ({ children }) => (
    <div className="editorial-prose__table">
      <table>{children}</table>
    </div>
  ),
  th: ({ children }) => <th>{children}</th>,
  td: ({ children }) => <td>{children}</td>,
};

export function BlogContent({
  post,
  nextPost,
  brandLabel,
  navigation,
  profileName,
  profileRole,
  articleContent,
}: {
  post: BlogPost;
  nextPost: NextPost | null;
  brandLabel: string;
  navigation: PortfolioNavigationItem[];
  profileName: string;
  profileRole: string;
  articleContent: PortfolioSectionContent;
}) {
  const articleRef = useRef<HTMLElement>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const content = useMemo(
    () => prepareArticleContent(post.content, post.title),
    [post.content, post.title],
  );
  const sections = useMemo(() => extractSections(content), [content]);
  const wordCount = useMemo(
    () => content.trim().split(/\s+/).filter(Boolean).length,
    [content],
  );
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 220));
  const publishedDate = formatEditorialDate(post.published_at);
  const updatedDate = formatEditorialDate(post.updated_at);

  useEffect(() => {
    const updateProgress = () => {
      const article = articleRef.current;
      if (!article) return;

      const start = article.offsetTop;
      const distance = Math.max(1, article.offsetHeight - window.innerHeight);
      const progress = Math.min(
        1,
        Math.max(0, (window.scrollY - start) / distance),
      );
      setReadingProgress(progress);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  useEffect(() => {
    if (sections.length === 0) return;

    const headings = sections
      .map((section) => document.getElementById(section.id))
      .filter((heading): heading is HTMLElement => Boolean(heading));
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleHeading = entries.find((entry) => entry.isIntersecting);
        if (visibleHeading) setActiveSection(visibleHeading.target.id);
      },
      { rootMargin: "-18% 0px -68%", threshold: 0 },
    );

    headings.forEach((heading) => observer.observe(heading));
    setActiveSection(headings[0]?.id ?? null);

    return () => observer.disconnect();
  }, [sections]);

  return (
    <main className="editorial-page">
      <EditorialSubpageHeader brandLabel={brandLabel} navigation={navigation} />
      <div
        className="editorial-article__progress"
        aria-hidden="true"
        style={{ transform: `scaleX(${readingProgress})` }}
      />

      <article ref={articleRef} className="shell editorial-article">
        <Link className="editorial-article__back" href="/blog">
          <ArrowLeft aria-hidden="true" /> All writing
        </Link>

        <header className="editorial-article__header">
          <div className="editorial-article__meta">
            <span className="section-index">{articleContent.eyebrow}</span>
            {publishedDate ? (
              <time dateTime={post.published_at ?? undefined}>
                {publishedDate}
              </time>
            ) : null}
          </div>

          <div className="editorial-article__headline">
            <h1>{post.title}</h1>
            <div className="editorial-article__summary">
              {post.excerpt ? <p>{post.excerpt}</p> : null}
              <div className="editorial-article__reading-meta">
                <span>{readingMinutes} min read</span>
                <span>{wordCount.toLocaleString("en-US")} words</span>
              </div>
              <ul aria-label="Topics">
                {post.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </div>
          </div>
        </header>

        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt=""
            className="editorial-article__cover"
          />
        ) : null}

        <div className="editorial-reading-layout">
          <aside className="editorial-article__toc" aria-label="On this page">
            <div>
              <span className="section-index">Inside this note</span>
              <ol>
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      aria-current={
                        activeSection === section.id ? "location" : undefined
                      }
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {section.label}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          <div className="editorial-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {content}
            </ReactMarkdown>
          </div>

          <aside
            className="editorial-article__facts"
            aria-label="Article details"
          >
            <div>
              <span className="section-index">Article details</span>
              <dl>
                <div>
                  <dt>Written by</dt>
                  <dd>{profileName}</dd>
                </div>
                <div>
                  <dt>Reading time</dt>
                  <dd>{readingMinutes} minutes</dd>
                </div>
                {updatedDate ? (
                  <div>
                    <dt>Last updated</dt>
                    <dd>{updatedDate}</dd>
                  </div>
                ) : null}
              </dl>
              <Link href="/#contact">
                Discuss an idea <ArrowUpRight aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>

        <footer className="editorial-article__footer">
          <div className="editorial-article__signoff">
            <span className="section-index">
              {articleContent.supportingText}
            </span>
            <h2>{articleContent.headline}</h2>
            <p>
              {articleContent.description} Written by {profileName},{" "}
              {profileRole}.
            </p>
            <Link href="/#contact">
              Start a conversation <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>

          {nextPost ? (
            <Link
              className="editorial-article__next"
              href={`/blog/${nextPost.slug}`}
            >
              <span className="section-index">Continue reading</span>
              <h2>{nextPost.title}</h2>
              {nextPost.excerpt ? <p>{nextPost.excerpt}</p> : null}
              <span className="editorial-article__next-action">
                Next note <ArrowRight aria-hidden="true" />
              </span>
            </Link>
          ) : (
            <Link className="editorial-article__next" href="/blog">
              <span className="section-index">Keep exploring</span>
              <h2>Return to the complete writing index.</h2>
              <span className="editorial-article__next-action">
                All writing <ArrowRight aria-hidden="true" />
              </span>
            </Link>
          )}
        </footer>
      </article>
    </main>
  );
}
