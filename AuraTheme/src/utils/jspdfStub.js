/**
 * Safe fallback stub for jsPDF when the npm package is not installed locally.
 */
export class jsPDF {
  constructor() {
    this.internal = {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    };
  }
  setFillColor() { return this; }
  rect() { return this; }
  setFont() { return this; }
  setFontSize() { return this; }
  setTextColor() { return this; }
  text() { return this; }
  setDrawColor() { return this; }
  setLineWidth() { return this; }
  line() { return this; }
  roundedRect() { return this; }
  addPage() { return this; }
  splitTextToSize(text) { return Array.isArray(text) ? text : [String(text)]; }
  save(filename = 'order-receipt.pdf') {
    if (typeof window !== 'undefined') {
      console.info(`[Aura] jsPDF package not found. Opening print dialog for: ${filename}`);
      window.print();
    }
  }
}

export default jsPDF;
