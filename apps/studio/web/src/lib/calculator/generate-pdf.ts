import { jsPDF } from "jspdf";
import { APP_BRANDS } from "@jayantgoyal/web-brand";
import type { CalculationWithDenominations } from "@/lib/calculator/database";

const STUDIO_HOST = new URL(APP_BRANDS.studio.canonicalUrl).hostname;

function parseTimestamp(timestamp: string): Date | null {
  if (timestamp.includes("T") || timestamp.includes("Z")) {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  }
  const parts = timestamp.split(" ");
  if (parts.length !== 2) return null;
  const [day, month, year] = parts[0]?.split("/") ?? [];
  const [hours, minutes, seconds] = parts[1]?.split(":") ?? [];
  if (!day || !month || !year || !hours || !minutes || !seconds) return null;
  const date = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds),
  );
  return isNaN(date.getTime()) ? null : date;
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCurrency(amount: number): string {
  const prefix = amount < 0 ? "-" : "";
  return `${prefix}\u20B9${Math.abs(amount).toLocaleString("en-IN")}`;
}

export function generateCalculationPDF(
  calc: CalculationWithDenominations,
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const timestamp = calc.ist_timestamp || calc.created_at || "";
  const date = parseTimestamp(timestamp);
  const dateStr = date ? formatDate(date) : "N/A";
  const timeStr = date ? `${formatTime(date)} IST` : "N/A";

  const sortedDenoms = [...calc.denominations].sort(
    (a, b) => b.denomination - a.denomination,
  );
  const grandTotal = sortedDenoms.reduce(
    (sum, d) => sum + d.denomination * d.count,
    0,
  );
  const totalNotes = sortedDenoms.reduce((sum, d) => sum + d.count, 0);

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Cash Denomination Report", pageWidth / 2, y, { align: "center" });
  y += 10;

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Date & Time
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${dateStr}`, margin, y);
  doc.text(`Time: ${timeStr}`, pageWidth - margin, y, { align: "right" });
  y += 6;

  // Note
  if (calc.note) {
    doc.setFont("helvetica", "italic");
    doc.text(`Note: ${calc.note}`, margin, y, {
      maxWidth: contentWidth,
    });
    const noteLines = doc.splitTextToSize(`Note: ${calc.note}`, contentWidth);
    y += noteLines.length * 5;
  }
  y += 4;

  // Summary cards
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(248, 248, 248);
  const cardWidth = (contentWidth - 8) / 3;
  const cardHeight = 18;
  const cards = [
    { label: "Grand Total", value: formatCurrency(grandTotal) },
    {
      label: "Denominations",
      value: String(sortedDenoms.filter((d) => d.count !== 0).length),
    },
    { label: "Total Notes", value: String(totalNotes) },
  ];
  cards.forEach((card, i) => {
    const x = margin + i * (cardWidth + 4);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "FD");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(card.label, x + cardWidth / 2, y + 6, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(card.value, x + cardWidth / 2, y + 14, { align: "center" });
  });
  y += cardHeight + 8;

  // Table header
  const col1X = margin;
  const col2X = margin + contentWidth * 0.45;
  const col3X = margin + contentWidth * 0.7;
  const rowHeight = 8;

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, rowHeight, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80, 80, 80);
  doc.text("Denomination", col1X + 4, y + 5.5);
  doc.text("Count", col2X + 4, y + 5.5);
  doc.text("Total", col3X + 4, y + 5.5);
  y += rowHeight;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  sortedDenoms.forEach((denom, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(margin, y, contentWidth, rowHeight, "F");
    }

    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

    doc.setFontSize(9);
    doc.text(
      `\u20B9${denom.denomination.toLocaleString("en-IN")}`,
      col1X + 4,
      y + 5.5,
    );
    doc.text(String(denom.count), col2X + 4, y + 5.5);

    const total = denom.denomination * denom.count;
    if (total < 0) {
      doc.setTextColor(220, 38, 38);
    } else {
      doc.setTextColor(22, 163, 74);
    }
    doc.text(formatCurrency(total), col3X + 4, y + 5.5);
    doc.setTextColor(0, 0, 0);
    y += rowHeight;
  });

  // Grand total row
  y += 2;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  if (grandTotal < 0) {
    doc.setTextColor(220, 38, 38);
  } else {
    doc.setTextColor(22, 163, 74);
  }
  doc.text(
    `Grand Total: ${formatCurrency(grandTotal)}`,
    pageWidth - margin,
    y,
    {
      align: "right",
    },
  );
  doc.setTextColor(0, 0, 0);

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Generated on ${new Date().toLocaleDateString("en-IN")} | ${STUDIO_HOST}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" },
  );

  // Download
  const fileDate = dateStr.replace(/\//g, "-");
  doc.save(`calculation-${fileDate}.pdf`);
}
