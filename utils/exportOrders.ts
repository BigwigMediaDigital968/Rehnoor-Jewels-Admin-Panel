import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Matches your Order interface
export interface ExportableOrder {
  orderNumber: string;
  placedAt: string;
  status: string;
  source: string;
  isPriority?: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  items: Array<{
    name: string;
    sku?: string;
    category?: string;
    metal?: string;
    purity?: string;
    sizeSelected?: string;
    variant?: { title?: string } | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    customNote?: string;
  }>;
  pricing: {
    subtotal: number;
    shippingCharge: number;
    discountAmount: number;
    prepaidDiscount?: number;
    taxAmount: number;
    total: number;
  };
  coupon?: { code?: string; discountAmount?: number } | null;
  payment: {
    method: string;
    status: string;
    amountPaid?: number;
    gatewayOrderId?: string;
    gatewayPaymentId?: string;
    paidAt?: string;
    refundAmount?: number;
  };
  shipping?: {
    courierName?: string;
    carrier?: string;
    trackingNumber?: string;
    awbCode?: string;
    shippedAt?: string;
    deliveredAt?: string;
  };
  customerNote?: string;
  adminNote?: string;
  giftMessage?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAddress = (addr?: ExportableOrder["shippingAddress"]) => {
  if (!addr) return "—";
  return [
    addr.addressLine1,
    addr.addressLine2,
    addr.landmark ? `Landmark: ${addr.landmark}` : "",
    addr.city,
    addr.state,
    addr.pincode,
    addr.country,
  ]
    .filter(Boolean)
    .join(", ");
};

const formatItemsSummary = (items: ExportableOrder["items"]) =>
  items
    .map((i) => {
      const variant = i.variant?.title || i.sizeSelected || "";
      return `${i.name}${variant ? ` (${variant})` : ""} x${i.quantity} [₹${i.lineTotal}]`;
    })
    .join(" | ");

// ─── EXCEL EXPORT ─────────────────────────────────────────────────────────────

export function exportOrdersToExcel(orders: ExportableOrder[], filenamePrefix = "orders-export") {
  // Sheet 1: Full Orders Overview (1 row per order)
  const orderRows = orders.map((o) => ({
    "Order Number": o.orderNumber,
    "Order Date": formatDate(o.placedAt),
    "Order Status": o.status.replace(/_/g, " ").toUpperCase(),
    "Priority": o.isPriority ? "Yes" : "No",
    "Source": o.source || "website",
    "Customer Name": o.customerName,
    "Customer Email": o.customerEmail,
    "Customer Phone": o.customerPhone,
    "Recipient Name": o.shippingAddress?.fullName || o.customerName,
    "Recipient Phone": o.shippingAddress?.phone || o.customerPhone,
    "Shipping Address": formatAddress(o.shippingAddress),
    "City": o.shippingAddress?.city || "",
    "State": o.shippingAddress?.state || "",
    "Pincode": o.shippingAddress?.pincode || "",
    "Items Count": o.items.reduce((sum, i) => sum + i.quantity, 0),
    "Items Summary": formatItemsSummary(o.items),
    "Subtotal (INR)": o.pricing?.subtotal ?? 0,
    "Shipping Charge (INR)": o.pricing?.shippingCharge ?? 0,
    "Discount (INR)": o.pricing?.discountAmount ?? 0,
    "Prepaid Discount (INR)": o.pricing?.prepaidDiscount ?? 0,
    "Tax (INR)": o.pricing?.taxAmount ?? 0,
    "Grand Total (INR)": o.pricing?.total ?? 0,
    "Coupon Code": o.coupon?.code || "",
    "Payment Method": o.payment?.method?.toUpperCase() || "",
    "Payment Status": o.payment?.status?.toUpperCase() || "",
    "Amount Paid (INR)": o.payment?.amountPaid ?? 0,
    "Gateway Order ID": o.payment?.gatewayOrderId || "",
    "Gateway Payment ID": o.payment?.gatewayPaymentId || "",
    "Paid At": formatDate(o.payment?.paidAt),
    "Refund Amount (INR)": o.payment?.refundAmount ?? 0,
    "Courier": o.shipping?.courierName || o.shipping?.carrier || "",
    "AWB / Tracking No": o.shipping?.awbCode || o.shipping?.trackingNumber || "",
    "Shipped At": formatDate(o.shipping?.shippedAt),
    "Delivered At": formatDate(o.deliveredAt || o.shipping?.deliveredAt),
    "Cancelled At": formatDate(o.cancelledAt),
    "Cancellation Reason": o.cancellationReason || "",
    "Customer Note": o.customerNote || "",
    "Gift Message": o.giftMessage || "",
    "Admin Note": o.adminNote || "",
  }));

  // Sheet 2: Itemized Line Items (1 row per item)
  const itemRows = orders.flatMap((o) =>
    o.items.map((item) => ({
      "Order Number": o.orderNumber,
      "Order Date": formatDate(o.placedAt),
      "Order Status": o.status.replace(/_/g, " ").toUpperCase(),
      "Customer Name": o.customerName,
      "Customer Phone": o.customerPhone,
      "Product Name": item.name,
      "SKU": item.sku || "",
      "Category": item.category || "",
      "Variant / Size": item.variant?.title || item.sizeSelected || "",
      "Metal / Purity": [item.metal, item.purity].filter(Boolean).join(" "),
      "Unit Price (INR)": item.unitPrice,
      "Quantity": item.quantity,
      "Line Total (INR)": item.lineTotal,
      "Custom Note": item.customNote || "",
    })),
  );

  const wb = XLSX.utils.book_new();

  const wsOrders = XLSX.utils.json_to_sheet(orderRows);
  wsOrders["!cols"] = Object.keys(orderRows[0] || {}).map((key) => ({
    wch: Math.max(key.length + 4, 18),
  }));
  XLSX.utils.book_append_sheet(wb, wsOrders, "All Orders");

  const wsItems = XLSX.utils.json_to_sheet(itemRows);
  wsItems["!cols"] = Object.keys(itemRows[0] || {}).map((key) => ({
    wch: Math.max(key.length + 4, 18),
  }));
  XLSX.utils.book_append_sheet(wb, wsItems, "Order Items");

  const dateStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filenamePrefix}-${dateStamp}.xlsx`);
}

// ─── PDF EXPORT ───────────────────────────────────────────────────────────────

export function exportOrdersToPDF(orders: ExportableOrder[], filenamePrefix = "orders-export") {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, pageWidth, 54, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Orders Report", 28, 32);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const totalRevenue = orders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
  doc.text(
    `Generated: ${new Date().toLocaleString("en-IN")}  |  Total Orders: ${orders.length}  |  Total Value: INR ${totalRevenue.toLocaleString("en-IN")}`,
    28,
    46,
  );

  const tableRows = orders.map((o) => [
    `${o.orderNumber}\n${new Date(o.placedAt).toLocaleDateString("en-IN")}`,
    `${o.customerName}\n${o.customerPhone}\n${o.customerEmail}`,
    `${formatAddress(o.shippingAddress)}`,
    o.items
      .map((i) => `• ${i.name}${i.variant?.title ? ` (${i.variant.title})` : ""} x${i.quantity}`)
      .join("\n"),
    `Sub: INR ${o.pricing?.subtotal ?? 0}\nShip: INR ${o.pricing?.shippingCharge ?? 0}\nDisc: INR ${o.pricing?.discountAmount ?? 0}\nTotal: INR ${o.pricing?.total ?? 0}`,
    `${o.payment?.method?.toUpperCase() || "—"}\n${o.payment?.status?.toUpperCase() || "—"}${o.payment?.gatewayPaymentId ? `\nID: ${o.payment.gatewayPaymentId}` : ""}`,
    `${o.status.replace(/_/g, " ").toUpperCase()}\n${o.shipping?.courierName || ""}\n${o.shipping?.awbCode || o.shipping?.trackingNumber || ""}`.trim(),
  ]);

  autoTable(doc, {
    startY: 66,
    margin: { left: 24, right: 24 },
    head: [[
      "Order / Date",
      "Customer",
      "Shipping Address",
      "Items",
      "Pricing Breakdown",
      "Payment",
      "Status & Tracking",
    ]],
    body: tableRows,
    styles: {
      fontSize: 7.5,
      cellPadding: 5,
      valign: "top",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [139, 115, 85],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [253, 250, 243],
    },
    columnStyles: {
      0: { cellWidth: 72 },
      1: { cellWidth: 110 },
      2: { cellWidth: 135 },
      3: { cellWidth: 165 },
      4: { cellWidth: 95 },
      5: { cellWidth: 95 },
      6: { cellWidth: 95 },
    },
  });

  const dateStamp = new Date().toISOString().slice(0, 10);
  doc.save(`${filenamePrefix}-${dateStamp}.pdf`);
}