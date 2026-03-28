function requireJsPdf() {
  const engine = window.jspdf?.jsPDF;
  if (!engine) {
    throw new Error("PDF engine is unavailable.");
  }
  return engine;
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight) {
  const lines = doc.splitTextToSize(String(text || ""), maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export function downloadTextPdf({ filename = "lexicourt-export.pdf", title = "LexiCourt Export", subtitle = "", body = "" }) {
  const JsPdf = requireJsPdf();
  const doc = new JsPdf({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = 62;

  doc.setFillColor(10, 10, 15);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  y = addWrappedText(doc, title, margin, y, maxWidth, 28);

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 184, 196);
    doc.setFontSize(11);
    y += 8;
    y = addWrappedText(doc, subtitle, margin, y, maxWidth, 16);
  }

  doc.setDrawColor(52, 52, 58);
  y += 12;
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  doc.setFont("courier", "normal");
  doc.setTextColor(236, 238, 244);
  doc.setFontSize(11);
  const paragraphs = String(body || "").split("\n");

  paragraphs.forEach((paragraph) => {
    if (y > pageHeight - margin) {
      doc.addPage();
      doc.setFillColor(10, 10, 15);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      doc.setFont("courier", "normal");
      doc.setTextColor(236, 238, 244);
      doc.setFontSize(11);
      y = margin;
    }

    if (!paragraph.trim()) {
      y += 10;
      return;
    }

    y = addWrappedText(doc, paragraph, margin, y, maxWidth, 15) + 4;
  });

  doc.save(filename);
}
