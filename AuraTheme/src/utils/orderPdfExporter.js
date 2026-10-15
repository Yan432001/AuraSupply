import { jsPDF } from 'jspdf';

/**
 * Format currency helper
 */
const formatPrice = (amount) => {
  const num = Number(amount) || 0;
  return `$${num.toFixed(2)}`;
};

/**
 * Export a Single Order details as a downloadable PDF summary / receipt
 * @param {Object} order - Order object containing details, items, customer info, etc.
 * @param {Object} options - Optional branding/store details
 */
export function exportSingleOrderPdf(order, options = {}) {
  if (!order) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // 1. Top Decorative Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Accent line
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 37, pageWidth, 2.5, 'F');

  // Brand Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  const storeName = order.store_name || options.storeName || 'Aura Global';
  doc.text(storeName.toUpperCase(), margin, 18);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('OFFICIAL ORDER RECEIPT & SUMMARY', margin, 26);

  // Order Reference in top right
  const orderRef = order.referenceNo || order.orderId || order.id || 'AUR-000000';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text(orderRef, pageWidth - margin, 18, { align: 'right' });

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleString()
    : new Date().toLocaleString();
  doc.text(dateStr, pageWidth - margin, 26, { align: 'right' });

  let curY = 48;

  // 2. Status & Overview Info Boxes
  const boxWidth = (contentWidth - 6) / 2;
  const boxHeight = 32;

  // Left Box: Customer Info
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, curY, boxWidth, boxHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CUSTOMER DETAILS', margin + 5, curY + 7);

  const customerName = order.customer?.name || order.customerName || 'Guest Customer';
  const customerPhone = order.customer?.phone || order.customerPhone || 'N/A';
  const customerEmail = order.customer?.email || order.customerEmail || '';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${customerName}`, margin + 5, curY + 14);
  doc.text(`Phone: ${customerPhone}`, margin + 5, curY + 20);
  if (customerEmail) {
    doc.text(`Email: ${customerEmail}`, margin + 5, curY + 26);
  } else {
    const loc = order.customer?.address || order.tableNumber || 'In-store fulfillment';
    doc.text(`Location: ${loc}`, margin + 5, curY + 26);
  }

  // Right Box: Fulfillment & Status Info
  const rightBoxX = margin + boxWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightBoxX, curY, boxWidth, boxHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ORDER SPECIFICATIONS', rightBoxX + 5, curY + 7);

  const status = (order.status || 'Confirmed').toUpperCase();
  const fulfillment = (order.orderType || order.deliveryMethod || 'Dine-In').toUpperCase();
  const payment = (order.paymentMethod || 'KHQR / Mobile Banking').toUpperCase();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Status: ${status}`, rightBoxX + 5, curY + 14);
  doc.text(`Fulfillment: ${fulfillment}`, rightBoxX + 5, curY + 20);
  doc.text(`Payment: ${payment}`, rightBoxX + 5, curY + 26);

  curY += boxHeight + 10;

  // 3. Customer Note if available
  const customerNote = order.customer?.note || order.notes || order.orderNotes;
  if (customerNote && customerNote.trim()) {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(251, 191, 36);
    doc.roundedRect(margin, curY, contentWidth, 12, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(146, 64, 14); // amber-800
    doc.text('Special Instructions:', margin + 4, curY + 5);

    doc.setFont('helvetica', 'normal');
    doc.text(customerNote.substring(0, 95), margin + 38, curY + 5);

    curY += 16;
  }

  // 4. Line Items Table Header
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, curY, contentWidth, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);

  doc.text('#', margin + 3, curY + 5.5);
  doc.text('ITEM DESCRIPTION', margin + 14, curY + 5.5);
  doc.text('QTY', margin + contentWidth - 55, curY + 5.5, { align: 'right' });
  doc.text('UNIT PRICE', margin + contentWidth - 28, curY + 5.5, { align: 'right' });
  doc.text('TOTAL', margin + contentWidth - 4, curY + 5.5, { align: 'right' });

  curY += 8;

  // 5. Line Items Rows
  const items = order.items || [];
  let subtotalCalc = 0;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  if (items.length === 0) {
    doc.setTextColor(148, 163, 184);
    doc.text('No item details recorded.', margin + 14, curY + 8);
    curY += 12;
  } else {
    items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.setDrawColor(241, 245, 249);
      doc.rect(margin, curY, contentWidth, 9, 'FD');

      const itemName = item.name || item.title || `Item #${index + 1}`;
      const qty = item.quantity || 1;
      const unitPrice = Number(item.price) || 0;
      const lineTotal = Number(item.subtotal || qty * unitPrice);
      subtotalCalc += lineTotal;

      doc.setTextColor(100, 116, 139);
      doc.text(String(index + 1), margin + 3, curY + 6);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(itemName.substring(0, 42), margin + 14, curY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(String(qty), margin + contentWidth - 55, curY + 6, { align: 'right' });
      doc.text(formatPrice(unitPrice), margin + contentWidth - 28, curY + 6, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatPrice(lineTotal), margin + contentWidth - 4, curY + 6, { align: 'right' });

      curY += 9;
    });
  }

  curY += 4;

  // 6. Totals Breakdown Card (Right aligned)
  const totalsWidth = 75;
  const totalsX = margin + contentWidth - totalsWidth;

  const finalSubtotal = Number(order.subtotal ?? subtotalCalc);
  const deliveryFee = Number(order.deliveryFee ?? order.shipping ?? 0);
  const taxFee = Number(order.tax ?? 0);
  const grandTotal = Number(order.grandTotal ?? order.total ?? (finalSubtotal + deliveryFee + taxFee));

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(totalsX, curY, totalsWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);

  // Subtotal
  doc.text('Subtotal:', totalsX + 5, curY + 7);
  doc.text(formatPrice(finalSubtotal), totalsX + totalsWidth - 5, curY + 7, { align: 'right' });

  // Shipping / Delivery
  doc.text('Delivery / Shipping:', totalsX + 5, curY + 14);
  doc.text(formatPrice(deliveryFee), totalsX + totalsWidth - 5, curY + 14, { align: 'right' });

  // Tax
  if (taxFee > 0) {
    doc.text('Taxes (10%):', totalsX + 5, curY + 20);
    doc.text(formatPrice(taxFee), totalsX + totalsWidth - 5, curY + 20, { align: 'right' });
  }

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(totalsX + 4, curY + 24, totalsX + totalsWidth - 4, curY + 24);

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text('GRAND TOTAL:', totalsX + 5, curY + 30);
  doc.text(formatPrice(grandTotal), totalsX + totalsWidth - 5, curY + 30, { align: 'right' });

  // 7. Footer
  const footerY = pageHeight - 16;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Aura Global E-Commerce & Retail Network • Phnom Penh, Cambodia • contact@auraglobal.com`,
    margin,
    footerY
  );
  doc.text(`Page 1 of 1`, pageWidth - margin, footerY, { align: 'right' });

  // Save the PDF
  const filename = `Order_${orderRef}_Summary.pdf`;
  doc.save(filename);
}

/**
 * Export Multi-Order History Report as a downloadable PDF summary for Administrators or Users
 * @param {Array} orders - Array of order objects
 * @param {Object} filterContext - Context like { storeName, status, totalCount }
 */
export function exportOrderHistoryPdf(orders = [], filterContext = {}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // 1. Top Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 31, pageWidth, 2, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('AURA GLOBAL • ORDER HISTORY SUMMARY REPORT', margin, 15);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  const filterDesc = `Store Filter: ${filterContext.storeName || 'All Stores'}   |   Status: ${filterContext.status || 'All Statuses'}`;
  doc.text(filterDesc, margin, 23);

  // Generated timestamp in top right
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 15, { align: 'right' });
  doc.text(`Total Records: ${orders.length}`, pageWidth - margin, 23, { align: 'right' });

  let curY = 40;

  // 2. Summary KPI Metrics Card
  const totalRevenue = orders.reduce((acc, o) => acc + (Number(o.grandTotal || o.total || o.subtotal) || 0), 0);
  const completedOrders = orders.filter((o) => (o.status || '').toLowerCase() === 'completed').length;
  const pendingOrders = orders.filter((o) => (o.status || '').toLowerCase() === 'pending').length;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, curY, contentWidth, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);

  const kpiY = curY + 9;
  doc.text(`Total Revenue: ${formatPrice(totalRevenue)}`, margin + 8, kpiY);
  doc.text(`Total Orders: ${orders.length}`, margin + 80, kpiY);
  doc.text(`Completed: ${completedOrders}`, margin + 145, kpiY);
  doc.text(`Pending: ${pendingOrders}`, margin + 205, kpiY);

  curY += 20;

  // 3. Orders Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, curY, contentWidth, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);

  const colX = {
    index: margin + 3,
    ref: margin + 12,
    date: margin + 45,
    store: margin + 85,
    customer: margin + 135,
    items: margin + 185,
    status: margin + 230,
    amount: margin + contentWidth - 4,
  };

  doc.text('#', colX.index, curY + 5.5);
  doc.text('ORDER REF', colX.ref, curY + 5.5);
  doc.text('DATE & TIME', colX.date, curY + 5.5);
  doc.text('STORE / CONCEPT', colX.store, curY + 5.5);
  doc.text('CUSTOMER', colX.customer, curY + 5.5);
  doc.text('ITEMS SUMMARY', colX.items, curY + 5.5);
  doc.text('STATUS', colX.status, curY + 5.5);
  doc.text('TOTAL', colX.amount, curY + 5.5, { align: 'right' });

  curY += 8;

  // 4. Order Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  orders.slice(0, 30).forEach((order, index) => {
    // Check if new page needed
    if (curY > pageHeight - 20) {
      doc.addPage();
      curY = 20;
      // Re-render header
      doc.setFillColor(30, 41, 59);
      doc.rect(margin, curY, contentWidth, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text('#', colX.index, curY + 5.5);
      doc.text('ORDER REF', colX.ref, curY + 5.5);
      doc.text('DATE & TIME', colX.date, curY + 5.5);
      doc.text('STORE / CONCEPT', colX.store, curY + 5.5);
      doc.text('CUSTOMER', colX.customer, curY + 5.5);
      doc.text('ITEMS SUMMARY', colX.items, curY + 5.5);
      doc.text('STATUS', colX.status, curY + 5.5);
      doc.text('TOTAL', colX.amount, curY + 5.5, { align: 'right' });
      curY += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    const isEven = index % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(241, 245, 249);
    doc.rect(margin, curY, contentWidth, 7.5, 'FD');

    const ref = order.referenceNo || order.orderId || order.id || `ORD-${index + 1}`;
    const dateFormatted = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
    const store = (order.store_name || order.store || 'Aura Store').substring(0, 22);
    const customer = (order.customer?.name || order.customerName || 'Guest').substring(0, 20);
    const itemCount = order.items?.length || 1;
    const itemsText = `${itemCount} item${itemCount > 1 ? 's' : ''}`;
    const statusText = (order.status || 'Confirmed').toUpperCase();
    const amount = Number(order.grandTotal || order.total || order.subtotal) || 0;

    doc.setTextColor(100, 116, 139);
    doc.text(String(index + 1), colX.index, curY + 5);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(ref.substring(0, 14), colX.ref, curY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(dateFormatted, colX.date, curY + 5);
    doc.text(store, colX.store, curY + 5);
    doc.text(customer, colX.customer, curY + 5);
    doc.text(itemsText, colX.items, curY + 5);

    // Status color
    if (statusText === 'COMPLETED') {
      doc.setTextColor(16, 185, 129); // green
    } else if (statusText === 'PENDING') {
      doc.setTextColor(217, 119, 6); // amber
    } else {
      doc.setTextColor(37, 99, 235); // blue
    }
    doc.text(statusText, colX.status, curY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatPrice(amount), colX.amount, curY + 5, { align: 'right' });

    curY += 7.5;
  });

  // Footer
  const footerY = pageHeight - 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Aura Global Multi-Store Order History Report • Confidential & Internal Use Only', margin, footerY + 2);
  doc.text(`Generated by Aura Admin Console`, pageWidth - margin, footerY + 2, { align: 'right' });

  // Save PDF
  const filename = `Aura_Orders_History_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
