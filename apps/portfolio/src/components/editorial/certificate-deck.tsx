"use client";

/* eslint-disable @next/next/no-img-element */

import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useState } from "react";

import type {
  PortfolioCredential,
  PortfolioSectionContent,
} from "@/lib/portfolio/editorial-data";
import { getCompactSectionHeading } from "@/lib/portfolio/section-heading";

export function CertificateDeck({
  credentials,
  content,
}: {
  credentials: PortfolioCredential[];
  content: PortfolioSectionContent;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCertificate = credentials[activeIndex] ?? credentials[0];
  const heading = getCompactSectionHeading(content.eyebrow, content.headline);

  if (!activeCertificate) return null;

  function showPrevious() {
    setActiveIndex((current) =>
      current === 0 ? credentials.length - 1 : current - 1,
    );
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % credentials.length);
  }

  return (
    <div className="credential-gallery">
      <div className="credential-gallery__heading">
        <span className="section-index">{heading.label}</span>
        <div>
          <h3>{heading.title}</h3>
          <p>{content.description}</p>
        </div>
      </div>

      <div className="certificate-deck">
        <div className="certificate-deck__stage">
          <span className="certificate-deck__back certificate-deck__back--left" />
          <span className="certificate-deck__back certificate-deck__back--right" />
          <a
            className="certificate-deck__active"
            href={activeCertificate.href}
            target="_blank"
            rel="noreferrer"
            key={activeCertificate.name}
          >
            <img
              src={activeCertificate.image}
              alt={activeCertificate.imageAlt}
            />
          </a>
        </div>

        <div className="certificate-deck__controls">
          <button
            type="button"
            onClick={showPrevious}
            aria-label="Previous certificate"
          >
            <ArrowLeft aria-hidden="true" />
          </button>
          <div aria-live="polite">
            <span>
              {activeCertificate.category} · {activeCertificate.issuer}
            </span>
            <strong>{activeCertificate.name}</strong>
            {activeCertificate.description ? (
              <p className="certificate-deck__description">
                {activeCertificate.description}
              </p>
            ) : null}
            {activeCertificate.issuedAt || activeCertificate.credentialId ? (
              <div className="certificate-deck__metadata">
                {activeCertificate.issuedAt ? (
                  <span>Issued {activeCertificate.issuedAt}</span>
                ) : null}
                {activeCertificate.credentialId ? (
                  <span>ID {activeCertificate.credentialId}</span>
                ) : null}
              </div>
            ) : null}
            {activeCertificate.credentialUrl ? (
              <a
                className="certificate-deck__verify"
                href={activeCertificate.credentialUrl}
                target="_blank"
                rel="noreferrer"
              >
                Verify credential <ArrowUpRight aria-hidden="true" />
              </a>
            ) : null}
          </div>
          <button
            type="button"
            onClick={showNext}
            aria-label="Next certificate"
          >
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
