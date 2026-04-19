// Server-side PDF invoice builder. Returns a Buffer so the caller can attach
// it to an email or stream it as an HTTP response.
import PDFDocument from 'pdfkit';

const GOLD = '#D4AF37';
const INK = '#111114';
const MUTED = '#6B7280';

function fmtUSD(n) {
  return `$${Number(n).toFixed(2)}`;
}

export function buildInvoicePdf(order) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header band
    doc.rect(0, 0, doc.page.width, 90).fill(INK);
    doc.fillColor(GOLD).fontSize(24).font('Helvetica-Bold').text('MANSA ELECTRONICS', 50, 32);
    doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica').text('Premium iPhones & Accessories', 50, 62);
    doc.fillColor('#FFFFFF').fontSize(10).text('INVOICE', 0, 40, { align: 'right', width: doc.page.width - 50 });

    // Spacer below header
    doc.moveDown(4);
    doc.fillColor(INK);

    // Order meta
    const metaY = 120;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text('Order', 50, metaY);
    doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(order.id, 50, metaY + 14);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text('Date', 250, metaY);
    doc.font('Helvetica').fontSize(10).fillColor(MUTED)
      .text(new Date(order.createdAt).toLocaleString(), 250, metaY + 14);

    // Bill-to
    const billY = metaY + 48;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text('Bill To', 50, billY);
    doc.font('Helvetica').fontSize(10).fillColor(INK)
      .text(order.customer.name, 50, billY + 14)
      .text(order.customer.email, 50, billY + 28)
      .text(order.customer.phone, 50, billY + 42)
      .text(order.customer.address, 50, billY + 56, { width: 250 });

    // Table header
    let y = billY + 110;
    doc.rect(50, y - 6, doc.page.width - 100, 22).fill(GOLD);
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(10);
    doc.text('Item', 58, y);
    doc.text('Condition', 300, y, { width: 70, align: 'left' });
    doc.text('Qty', 380, y, { width: 40, align: 'right' });
    doc.text('Price', 430, y, { width: 55, align: 'right' });
    doc.text('Total', 495, y, { width: 55, align: 'right' });

    y += 24;
    doc.font('Helvetica').fontSize(10).fillColor(INK);
    for (const line of order.items) {
      const label = line.storage && line.storage !== '-'
        ? `${line.model} — ${line.storage}`
        : line.model;
      const lineTotal = line.price * line.quantity;
      doc.text(label, 58, y, { width: 236 });
      doc.text(`Grade ${line.condition}`, 300, y, { width: 70 });
      doc.text(String(line.quantity), 380, y, { width: 40, align: 'right' });
      doc.text(fmtUSD(line.price), 430, y, { width: 55, align: 'right' });
      doc.text(fmtUSD(lineTotal), 495, y, { width: 55, align: 'right' });
      y += 22;
      doc.moveTo(50, y - 6).lineTo(doc.page.width - 50, y - 6).strokeColor('#E5E7EB').stroke();
    }

    // Totals
    y += 10;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(INK);
    doc.text('Subtotal', 380, y, { width: 115, align: 'right' });
    doc.text(fmtUSD(order.totals.subtotal), 495, y, { width: 55, align: 'right' });
    y += 18;
    doc.fontSize(13).fillColor(GOLD);
    doc.text('TOTAL', 380, y, { width: 115, align: 'right' });
    doc.text(fmtUSD(order.totals.total), 495, y, { width: 55, align: 'right' });

    // Footer
    doc.font('Helvetica').fontSize(9).fillColor(MUTED)
      .text('Thank you for your order. Payment & shipping details will follow by email.',
        50, doc.page.height - 80, { align: 'center', width: doc.page.width - 100 });
    doc.text('Mansa Electronics · mansa-electronics.com',
      50, doc.page.height - 65, { align: 'center', width: doc.page.width - 100 });

    doc.end();
  });
}
