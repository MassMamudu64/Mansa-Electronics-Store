// Thin wrapper over Nodemailer. Reads SMTP config from env so swapping
// providers (Gmail → SendGrid → Mailtrap) is a .env change, not a code change.
import nodemailer from 'nodemailer';

let cachedTransport = null;

function getTransport() {
  if (cachedTransport) return cachedTransport;
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env.local');
  }
  cachedTransport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: String(SMTP_SECURE).toLowerCase() === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return cachedTransport;
}

function fmtUSD(n) { return `$${Number(n).toFixed(2)}`; }

function renderOrderSummary(order) {
  const lines = order.items.map((i) => {
    const label = i.storage && i.storage !== '-' ? `${i.model} — ${i.storage} (Grade ${i.condition})` : `${i.model} (Grade ${i.condition})`;
    return `  • ${label} × ${i.quantity}   ${fmtUSD(i.price * i.quantity)}`;
  }).join('\n');
  return `Order ${order.id}
Placed: ${new Date(order.createdAt).toLocaleString()}

Customer
  ${order.customer.name}
  ${order.customer.email}
  ${order.customer.phone}
  ${order.customer.address}

Items
${lines}

Subtotal: ${fmtUSD(order.totals.subtotal)}
TOTAL:    ${fmtUSD(order.totals.total)}
`;
}

function renderHtml(order) {
  const rows = order.items.map((i) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${i.model}${i.storage && i.storage !== '-' ? ' — ' + i.storage : ''}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">Grade ${i.condition}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${i.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${fmtUSD(i.price)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${fmtUSD(i.price * i.quantity)}</td>
    </tr>`).join('');
  return `<div style="font-family:Inter,Arial,sans-serif;color:#111;max-width:640px;margin:auto">
    <div style="background:#111114;color:#D4AF37;padding:16px 20px;font-weight:700;letter-spacing:1px">MANSA ELECTRONICS</div>
    <div style="padding:20px">
      <h2 style="margin:0 0 8px">New order ${order.id}</h2>
      <p style="color:#555;margin:0 0 16px">Placed ${new Date(order.createdAt).toLocaleString()}</p>
      <h3>Customer</h3>
      <p style="margin:0">${order.customer.name}<br/>${order.customer.email}<br/>${order.customer.phone}<br/>${order.customer.address}</p>
      <h3>Items</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead><tr style="background:#D4AF37;color:#111">
          <th style="padding:8px;text-align:left">Item</th>
          <th style="padding:8px;text-align:left">Condition</th>
          <th style="padding:8px;text-align:right">Qty</th>
          <th style="padding:8px;text-align:right">Price</th>
          <th style="padding:8px;text-align:right">Total</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="text-align:right;font-size:16px;margin-top:16px">
        Subtotal: <strong>${fmtUSD(order.totals.subtotal)}</strong><br/>
        <span style="color:#D4AF37;font-size:18px">TOTAL: <strong>${fmtUSD(order.totals.total)}</strong></span>
      </p>
    </div>
  </div>`;
}

export async function sendOrderEmail({ order, pdfBuffer }) {
  const transport = getTransport();
  const to = process.env.ORDERS_INBOX;
  if (!to) throw new Error('ORDERS_INBOX is not set');
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;

  return transport.sendMail({
    from,
    to,
    replyTo: order.customer.email,
    subject: `New order ${order.id} — ${order.customer.name} — ${fmtUSD(order.totals.total)}`,
    text: renderOrderSummary(order),
    html: renderHtml(order),
    attachments: [
      {
        filename: `invoice-${order.id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}
