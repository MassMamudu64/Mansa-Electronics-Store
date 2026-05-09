import 'server-only';
import type { OrderEmailItem, OrderEmailPayload } from './orderConfirmation';

function fmt(n: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
    Number(n),
  );
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderAdminOrderAlert(o: OrderEmailPayload): {
  subject: string;
  html: string;
} {
  const currency = o.currency ?? 'USD';
  const rows = o.items
    .map(
      (i: OrderEmailItem) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e5ea;font-size:14px;color:#111">${escape(i.name)}${i.sku ? `<br><span style="font-size:11px;color:#8e8e93">SKU: ${escape(i.sku)}</span>` : ''}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e5ea;font-size:14px;color:#636366;text-align:center">${i.quantity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e5ea;font-size:14px;color:#111;text-align:right">${fmt(i.price, currency)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e5ea;font-size:14px;font-weight:700;color:#111;text-align:right">${fmt(i.price * i.quantity, currency)}</td>
        </tr>`,
    )
    .join('');

  const subject = `New order ${o.orderRef} — ${o.customerName} — ${fmt(o.total, currency)}`;
  const placedAt = new Date(o.createdAt).toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f2f2f7;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f7;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:#111;padding:20px 28px">
            <p style="margin:0;font-size:18px;font-weight:900;letter-spacing:0.18em;color:#fff">MANSA ELECTRONICS</p>
            <p style="margin:4px 0 0;font-size:12px;color:#9b9b9f;letter-spacing:0.1em">NEW ORDER NOTIFICATION</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px">
            <h1 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#111">Order ${escape(o.orderRef)}</h1>
            <p style="margin:0 0 24px;font-size:13px;color:#636366">Placed ${escape(placedAt)}</p>

            <div style="background:#f2f2f7;border-radius:12px;padding:16px 20px;margin-bottom:24px">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#636366">Buyer</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#636366;padding:2px 0;width:80px">Name</td>
                  <td style="font-size:14px;font-weight:600;color:#111;padding:2px 0">${escape(o.customerName)}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#636366;padding:2px 0">Email</td>
                  <td style="font-size:14px;color:#111;padding:2px 0">
                    <a href="mailto:${escape(o.customerEmail)}" style="color:#0a84ff;text-decoration:none">${escape(o.customerEmail)}</a>
                  </td>
                </tr>
              </table>
            </div>

            <h2 style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#636366">Items</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e5ea;border-radius:10px;overflow:hidden;margin-bottom:20px">
              <thead>
                <tr style="background:#f2f2f7">
                  <th align="left" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#636366">Item</th>
                  <th align="center" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#636366">Qty</th>
                  <th align="right" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#636366">Unit</th>
                  <th align="right" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#636366">Total</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px">
              <tr>
                <td style="padding:4px 0;font-size:13px;color:#636366">Subtotal</td>
                <td align="right" style="padding:4px 0;font-size:14px;color:#111">${fmt(o.subtotal, currency)}</td>
              </tr>
              ${
                (o.bundleDiscount ?? 0) > 0
                  ? `<tr>
                <td style="padding:4px 0;font-size:13px;color:#16a34a">Discount</td>
                <td align="right" style="padding:4px 0;font-size:14px;color:#16a34a">−${fmt(o.bundleDiscount ?? 0, currency)}</td>
              </tr>`
                  : ''
              }
              <tr>
                <td style="padding:4px 0;font-size:13px;color:#636366">Delivery</td>
                <td align="right" style="padding:4px 0;font-size:14px;color:#111">${o.delivery === 0 ? 'Free' : fmt(o.delivery, currency)}</td>
              </tr>
              <tr>
                <td style="padding:10px 0 0;border-top:2px solid #111;font-size:16px;font-weight:800;color:#111">TOTAL</td>
                <td align="right" style="padding:10px 0 0;border-top:2px solid #111;font-size:18px;font-weight:900;color:#111">${fmt(o.total, currency)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f2f2f7;padding:16px 28px;border-top:1px solid #e5e5ea">
            <p style="margin:0;font-size:11px;color:#8e8e93;text-align:center">
              Mansa Electronics · Internal order alert · Reply to contact the buyer directly
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
