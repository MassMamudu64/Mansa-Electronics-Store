import nodemailer from 'nodemailer';

let cachedTransport = null;

function getTransport() {
  if (cachedTransport) return cachedTransport;
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env.local');
  }
  cachedTransport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: String(SMTP_SECURE).toLowerCase() === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return cachedTransport;
}

function fmt(n, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(n));
}

function renderHtml(order) {
  const rows = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e5ea;font-size:14px;color:#111">${i.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e5ea;font-size:14px;color:#636366;text-align:center">${i.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e5ea;font-size:14px;color:#111;text-align:right">${fmt(i.price ?? i.unitPrice)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e5ea;font-size:14px;font-weight:700;color:#111;text-align:right">${fmt((i.price ?? i.unitPrice) * i.quantity)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2f2f7;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f7;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr>
          <td style="background:#111;padding:20px 28px">
            <p style="margin:0;font-size:18px;font-weight:900;letter-spacing:0.18em;color:#fff">MANSA ELECTRONICS</p>
            <p style="margin:4px 0 0;font-size:12px;color:#636366;letter-spacing:0.1em">NEW ORDER NOTIFICATION</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px">

            <h2 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#111">
              Order ${order.orderRef ?? order.id}
            </h2>
            <p style="margin:0 0 24px;font-size:13px;color:#636366">
              Placed: ${new Date(order.createdAt ?? Date.now()).toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  })}
            </p>

            <!-- Customer details -->
            <div style="background:#f2f2f7;border-radius:12px;padding:16px 20px;margin-bottom:24px">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#636366">Customer</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="font-size:13px;color:#636366;padding:2px 0;width:100px">Name</td><td style="font-size:14px;font-weight:600;color:#111;padding:2px 0">${order.customer.name}</td></tr>
                <tr><td style="font-size:13px;color:#636366;padding:2px 0">Phone</td><td style="font-size:14px;font-weight:600;color:#111;padding:2px 0">${order.customer.phone}</td></tr>
                <tr><td style="font-size:13px;color:#636366;padding:2px 0">Email</td><td style="font-size:14px;color:#111;padding:2px 0">${order.customer.email}</td></tr>
                <tr><td style="font-size:13px;color:#636366;padding:2px 0">Address</td><td style="font-size:14px;color:#111;padding:2px 0">${order.customer.address}</td></tr>
                ${order.customer.notes ? `<tr><td style="font-size:13px;color:#636366;padding:2px 0">Notes</td><td style="font-size:14px;color:#111;padding:2px 0">${order.customer.notes}</td></tr>` : ''}
              </table>
            </div>

            <!-- Items table -->
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#636366">Order Items</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e5ea;border-radius:10px;overflow:hidden;margin-bottom:20px">
              <thead>
                <tr style="background:#f2f2f7">
                  <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#636366;text-align:left">Item</th>
                  <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#636366;text-align:center">Qty</th>
                  <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#636366;text-align:right">Unit</th>
                  <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#636366;text-align:right">Total</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td style="padding:4px 0;font-size:13px;color:#636366">Subtotal</td>
                <td style="padding:4px 0;font-size:14px;color:#111;text-align:right">${fmt(order.totals.subtotal)}</td>
              </tr>
              ${order.totals.bundleDiscount > 0 ? `<tr><td style="padding:4px 0;font-size:13px;color:#16a34a">Discount</td><td style="padding:4px 0;font-size:14px;color:#16a34a;text-align:right">−${fmt(order.totals.bundleDiscount)}</td></tr>` : ''}
              <tr>
                <td style="padding:4px 0;font-size:13px;color:#636366">Delivery</td>
                <td style="padding:4px 0;font-size:14px;color:#111;text-align:right">${order.totals.subtotal >= 50 ? 'Free' : fmt(5)}</td>
              </tr>
              <tr style="border-top:2px solid #111">
                <td style="padding:10px 0 0;font-size:16px;font-weight:800;color:#111">TOTAL</td>
                <td style="padding:10px 0 0;font-size:18px;font-weight:900;color:#111;text-align:right">${fmt(order.totals.total + (order.totals.subtotal >= 50 ? 0 : 5))}</td>
              </tr>
            </table>

            <div style="background:#f2f2f7;border-radius:12px;padding:14px 18px">
              <p style="margin:0;font-size:12px;color:#636366">
                <strong style="color:#111">Payment:</strong> Cash on Delivery (COD) — Collect payment on delivery.
              </p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f2f2f7;padding:16px 28px;border-top:1px solid #e5e5ea">
            <p style="margin:0;font-size:11px;color:#8e8e93;text-align:center">
              Mansa Electronics · Automated order notification · Do not reply to this email
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function renderText(order) {
  const lines = order.items
    .map((i) => `  - ${i.name} × ${i.quantity}   ${fmt((i.price ?? i.unitPrice) * i.quantity)}`)
    .join('\n');

  return `MANSA ELECTRONICS — New Order

Order: ${order.orderRef ?? order.id}
Placed: ${new Date(order.createdAt ?? Date.now()).toLocaleString()}

CUSTOMER
  Name:    ${order.customer.name}
  Phone:   ${order.customer.phone}
  Email:   ${order.customer.email}
  Address: ${order.customer.address}
${order.customer.notes ? `  Notes:   ${order.customer.notes}` : ''}

ITEMS
${lines}

TOTALS
  Subtotal: ${fmt(order.totals.subtotal)}
${order.totals.bundleDiscount > 0 ? `  Discount: -${fmt(order.totals.bundleDiscount)}\n` : ''}  Delivery: ${order.totals.subtotal >= 50 ? 'Free' : fmt(5)}
  TOTAL: ${fmt(order.totals.total + (order.totals.subtotal >= 50 ? 0 : 5))}

Payment: Cash on Delivery
`;
}

export async function sendOrderEmail({ order }) {
  const transport = getTransport();
  const to = process.env.ORDERS_INBOX;
  if (!to) throw new Error('ORDERS_INBOX is not set in environment');
  const from = process.env.MAIL_FROM ?? process.env.SMTP_USER;

  return transport.sendMail({
    from,
    to,
    replyTo: order.customer.email,
    subject: `🛍 New Order ${order.orderRef ?? order.id} — ${order.customer.name} — ${fmt(order.totals.total + (order.totals.subtotal >= 50 ? 0 : 5))}`,
    text: renderText(order),
    html: renderHtml(order),
  });
}
