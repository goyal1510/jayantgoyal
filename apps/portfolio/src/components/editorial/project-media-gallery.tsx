"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

export function ProjectMediaGallery({
  images,
  alt,
  eager = false,
}: {
  images: string[];
  alt: string;
  eager?: boolean;
}) {
  const sources =
    images.length > 0 ? images : ["/images/portfolio-light-desktop.png"];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (sources.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % sources.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [sources.length]);

  return (
    <div className="project-media-gallery" aria-label={`${alt} screenshots`}>
      {sources.map((source, index) => (
        <img
          key={source}
          className={`project-media-gallery__image${
            index === activeIndex ? " project-media-gallery__image--active" : ""
          }`}
          src={source}
          alt={index === activeIndex ? alt : ""}
          aria-hidden={index === activeIndex ? undefined : true}
          loading={eager || index === 0 ? "eager" : "lazy"}
        />
      ))}

      {sources.length > 1 ? (
        <div
          className="project-media-gallery__controls"
          aria-label="Screenshots"
        >
          {sources.map((source, index) => (
            <button
              key={source}
              type="button"
              aria-label={`Show screenshot ${index + 1}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
