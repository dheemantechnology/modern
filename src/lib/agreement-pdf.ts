import jsPDF from "jspdf";

export type AgreementData = {
  ref: string;
  vehicleName: string;
  vehicleYear: number;
  start: string;
  end: string;
  days: number;
  perDay: number;
  total: number;
  customerName: string;
  phone: string;
  email?: string;
  pickup: string;
  paymentMethod: string;
};

const NAVY: [number, number, number] = [12, 28, 56];
const CYAN: [number, number, number] = [0, 156, 184];
const MUTED: [number, number, number] = [110, 122, 138];
const LINE: [number, number, number] = [220, 226, 234];

export function generateAgreementPdf(d: AgreementData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  // ============== HEADER BAND ==============
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 110, "F");
  doc.setFillColor(...CYAN);
  doc.rect(0, 110, W, 4, "F");

  // Logo mark (stylised "M")
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(M, 28, 52, 52, 10, 10, "F");
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("M", M + 26, 64, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("MMS Auto Rentals", M + 70, 52);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(200, 230, 240);
  doc.text("Hargeisa · Somaliland · Premium fleet rental", M + 70, 70);
  doc.text("Booking Agreement & Pending Confirmation", M + 70, 86);

  // Reference chip (right)
  doc.setFillColor(...CYAN);
  doc.roundedRect(W - M - 150, 36, 150, 38, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("REFERENCE", W - M - 140, 50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(d.ref, W - M - 140, 66);

  let y = 140;

  // ============== STATUS BANNER ==============
  doc.setFillColor(255, 244, 214);
  doc.setDrawColor(240, 200, 80);
  doc.roundedRect(M, y, W - M * 2, 56, 8, 8, "FD");
  doc.setTextColor(120, 80, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("PAYMENT RECEIVED · AWAITING FINAL APPROVAL", M + 16, y + 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 60, 0);
  doc.text(
    "Your payment is held securely. Our team will confirm vehicle availability within 1 business hour.",
    M + 16, y + 38
  );
  doc.text("If we cannot fulfil this reservation, 100% of the amount paid is refunded — no deductions.", M + 16, y + 50);
  y += 76;

  // ============== BOOKING SUMMARY (2 columns) ==============
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Booking summary", M, y);
  y += 12;
  doc.setDrawColor(...LINE);
  doc.line(M, y, W - M, y);
  y += 16;

  const colW = (W - M * 2) / 2;
  const rows: Array<[string, string, string, string]> = [
    ["Customer", d.customerName, "Vehicle", `${d.vehicleName} (${d.vehicleYear})`],
    ["Phone", d.phone, "Pickup date", d.start],
    ["Email", d.email || "—", "Return date", d.end],
    ["Pickup location", d.pickup, "Rental length", `${d.days} day${d.days > 1 ? "s" : ""}`],
    ["Payment method", d.paymentMethod, "Daily rate", `$${d.perDay}`],
    ["Agreement date", today, "Total paid", `$${d.total}`],
  ];
  doc.setFontSize(9);
  rows.forEach(([k1, v1, k2, v2]) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(k1.toUpperCase(), M, y);
    doc.text(k2.toUpperCase(), M + colW, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.setFontSize(11);
    doc.text(String(v1), M, y + 14);
    doc.text(String(v2), M + colW, y + 14);
    doc.setFontSize(9);
    y += 32;
  });

  y += 4;

  // ============== TERMS ==============
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Terms & conditions of rental", M, y);
  y += 12;
  doc.setDrawColor(...LINE);
  doc.line(M, y, W - M, y);
  y += 14;

  const terms: Array<[string, string]> = [
    [
      "1. Pending approval & 100% refund guarantee",
      "This document confirms receipt of your payment. The reservation remains PENDING until MMS Auto Rentals' operations team verifies vehicle availability and the submitted documents. If MMS rejects or cannot fulfil the booking for any reason, the full amount paid will be returned to the original payment method within 1–3 business days, with no fees or deductions.",
    ],
    [
      "2. Required documents at pickup",
      "The driver must present (a) a valid driving licence with at least 6 months remaining validity, (b) a national ID or passport matching the licence, and (c) a refundable security deposit as quoted at pickup. Failure to present any of these voids the reservation and triggers the refund process described in clause 1.",
    ],
    [
      "3. Vehicle use & coverage",
      "The vehicle is provided with standard insurance and roadside assistance inside Somaliland. The renter agrees to operate the vehicle lawfully, avoid off-road use unless explicitly authorised in writing, and return it in the same condition received, fuel level included. Any traffic fines incurred during the rental period are the responsibility of the renter.",
    ],
    [
      "4. Cancellation by customer",
      "Cancellations made more than 24 hours before pickup are fully refundable. Cancellations within 24 hours of pickup incur a one-day rental charge; the remainder is refunded.",
    ],
    [
      "5. Shari'a-compliant pricing",
      "All pricing is fixed, transparent, and free of interest. There are no hidden charges. The total shown above is the only amount due for the rental period.",
    ],
    [
      "6. Data & privacy",
      "Documents uploaded during booking are encrypted, used solely to verify the rental, and deleted within 90 days of return unless required for an open dispute.",
    ],
  ];

  doc.setFontSize(10);
  terms.forEach(([title, body]) => {
    if (y > H - 180) { doc.addPage(); y = M; }
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text(title, M, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 70, 84);
    const lines = doc.splitTextToSize(body, W - M * 2);
    doc.text(lines, M, y);
    y += lines.length * 12 + 10;
  });

  // ============== SIGNATURE BLOCK ==============
  if (y > H - 200) { doc.addPage(); y = M; }
  y += 10;
  doc.setDrawColor(...LINE);
  doc.line(M, y, W - M, y);
  y += 24;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.text("Customer acknowledgement", M, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const ack = doc.splitTextToSize(
    `By submitting this booking, ${d.customerName || "the customer"} confirms that they have read, understood and accepted the terms above, and authorises MMS Auto Rentals to hold the funds pending approval.`,
    W - M * 2,
  );
  doc.text(ack, M, y);
  y += ack.length * 11 + 18;

  const sigW = (W - M * 2 - 24) / 2;
  doc.setDrawColor(...NAVY);
  doc.line(M, y, M + sigW, y);
  doc.line(M + sigW + 24, y, W - M, y);
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Customer signature", M, y + 12);
  doc.text("MMS Auto Rentals · authorised signatory", M + sigW + 24, y + 12);
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text(d.customerName || "—", M, y - 4);
  doc.text("Operations Manager", M + sigW + 24, y - 4);

  // ============== FOOTER (every page) ==============
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...NAVY);
    doc.rect(0, H - 56, W, 56, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Contact MMS Auto Rentals", M, H - 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(200, 220, 235);
    doc.text("Hotline 3032  ·  +252 63 4829 005  ·  hello@mmsauto.so", M, H - 22);
    doc.text("Durdur Building, Caro Edeg, Hargeisa, Somaliland  ·  mmsauto.so", M, H - 10);
    doc.text(`Page ${i} of ${pageCount}`, W - M, H - 10, { align: "right" });
    doc.text(`Ref ${d.ref}`, W - M, H - 22, { align: "right" });
  }

  doc.save(`MMS-Agreement-${d.ref}.pdf`);
}