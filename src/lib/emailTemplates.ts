export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[c];
  });
}

export const formatPeso = (value: unknown) =>
  `PHP ${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

export function getSiteUrl(fallbackOrigin?: string): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || fallbackOrigin || 'http://localhost:3000').replace(
    /\/+$/,
    ''
  );
}

const logoUrl = (siteUrl: string) => `${siteUrl}/assets/images/Logo123.png`;

/** Dark-themed email (matches the website's dark mode). */
export function darkEmailLayout(opts: {
  siteUrl: string;
  subtitle: string;
  content: string;
}): string {
  const { siteUrl, subtitle, content } = opts;
  return `
<div style="background:#1b110e;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#281a15;border:1px solid #5a3a22;border-radius:16px;overflow:hidden;">
    <div style="padding:28px 24px 18px;text-align:center;border-bottom:1px solid #3d2a20;">
      <img src="${logoUrl(siteUrl)}" alt="Feast &amp; Fête" width="84" height="84" style="display:block;margin:0 auto 10px;border-radius:50%;background:#fdf8f0;" />
      <div style="color:#f59e0b;font-size:22px;font-weight:700;letter-spacing:0.5px;">Feast &amp; Fête</div>
      <div style="color:#c8a99a;font-size:13px;margin-top:4px;">${escapeHtml(subtitle)}</div>
    </div>
    <div style="padding:28px 24px;color:#f5ede0;font-size:14px;line-height:1.6;">
      ${content}
    </div>
    <div style="padding:16px;text-align:center;background:#1b110e;color:#8a7266;font-size:11px;">
      Automated message from Feast &amp; Fête
    </div>
  </div>
</div>`;
}

export function darkButton(href: string, label: string): string {
  return `<a href="${href}" target="_blank" style="display:inline-block;background:#d97706;color:#ffffff;padding:13px 26px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;">${escapeHtml(label)}</a>`;
}

export interface SlipOrder {
  order_number: string;
  created_at?: string | null;
  event_date?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  delivery_address?: string | null;
  delivery_method?: string | null;
  payment_method?: string | null;
  subtotal?: number | null;
  delivery_fee?: number | null;
  total_amount?: number | null;
  order_items?: Array<{
    menu_item_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }> | null;
}

/** Light "Order Slip" receipt layout. */
export function orderSlipHtml(order: SlipOrder, siteUrl: string): string {
  const fmtDate = (v?: string | null) => {
    if (!v) return '-';
    const d = new Date(v);
    return Number.isNaN(d.getTime())
      ? escapeHtml(v)
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  const items = Array.isArray(order.order_items) ? order.order_items : [];
  const rows = items
    .map(
      (item, i) => `
      <tr>
        <td style="padding:10px 8px;font-size:13px;color:#1b1b1b;">${i + 1}. ${escapeHtml(item.menu_item_name)}</td>
        <td style="padding:10px 8px;font-size:13px;text-align:center;">${Number(item.quantity)}</td>
        <td style="padding:10px 8px;font-size:13px;text-align:right;">${formatPeso(item.unit_price)}</td>
        <td style="padding:10px 8px;font-size:13px;text-align:right;">${formatPeso(item.subtotal)}</td>
      </tr>`
    )
    .join('');
  const meta = (label: string, value: string) => `
      <tr>
        <td style="padding:6px 0;font-size:11px;font-weight:bold;letter-spacing:1.5px;color:#1b1b1b;width:110px;border-bottom:1px solid #d4d4d4;">${label}</td>
        <td style="padding:6px 0;font-size:12px;color:#333;border-bottom:1px solid #d4d4d4;">${value}</td>
      </tr>`;

  return `
<div style="background:#f1f1f1;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;padding:32px 28px;color:#1b1b1b;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="vertical-align:middle;">
          <div style="font-size:30px;font-weight:bold;letter-spacing:6px;color:#14261f;">ORDER SLIP</div>
        </td>
        <td style="text-align:right;vertical-align:middle;">
          <img src="${logoUrl(siteUrl)}" alt="Feast &amp; Fête" width="90" height="90" style="border-radius:50%;" />
        </td>
      </tr>
    </table>
    <div style="border-top:2px solid #555;margin:16px 0 20px;"></div>

    <table style="width:60%;border-collapse:collapse;margin-bottom:20px;">
      ${meta('ORDER NO:', escapeHtml(order.order_number))}
      ${meta('DATE:', fmtDate(order.created_at))}
      ${meta('EVENT DATE:', fmtDate(order.event_date))}
      ${meta('METHOD:', escapeHtml(order.delivery_method || '-'))}
      ${meta('PAYMENT:', escapeHtml(order.payment_method || '-'))}
    </table>

    <div style="border:1px solid #cfcfcf;padding:12px 14px;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:bold;letter-spacing:1.5px;margin-bottom:6px;">BILL TO:</div>
      <div style="font-size:12px;color:#333;line-height:1.7;">
        ${escapeHtml(order.customer_name || 'Customer')}<br />
        ${order.delivery_address ? `${escapeHtml(order.delivery_address)}<br />` : ''}
        ${order.customer_phone ? escapeHtml(order.customer_phone) : ''}
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:1px solid #999;">
          <th style="padding:8px;font-size:11px;letter-spacing:1.5px;text-align:left;">DESCRIPTION</th>
          <th style="padding:8px;font-size:11px;letter-spacing:1.5px;text-align:center;">QTY</th>
          <th style="padding:8px;font-size:11px;letter-spacing:1.5px;text-align:right;">PRICE</th>
          <th style="padding:8px;font-size:11px;letter-spacing:1.5px;text-align:right;">TOTAL</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="border-top:1px solid #cfcfcf;margin:8px 0 20px;"></div>

    <table style="width:55%;margin-left:auto;border-collapse:collapse;">
      <tr><td style="padding:7px 0;font-size:12px;color:#555;border-bottom:1px solid #d4d4d4;">subtotal:</td><td style="padding:7px 0;font-size:12px;text-align:right;border-bottom:1px solid #d4d4d4;">${formatPeso(order.subtotal)}</td></tr>
      <tr><td style="padding:7px 0;font-size:12px;color:#555;border-bottom:1px solid #d4d4d4;">delivery fee:</td><td style="padding:7px 0;font-size:12px;text-align:right;border-bottom:1px solid #d4d4d4;">${formatPeso(order.delivery_fee)}</td></tr>
      <tr><td style="padding:9px 0;font-size:12px;font-weight:bold;letter-spacing:1px;border-bottom:2px solid #555;">TOTAL AMOUNT:</td><td style="padding:9px 0;font-size:13px;font-weight:bold;text-align:right;border-bottom:2px solid #555;">${formatPeso(order.total_amount)}</td></tr>
    </table>

    <div style="text-align:center;margin-top:48px;">
      <div style="display:inline-block;border-top:2px solid #555;padding-top:6px;font-size:11px;font-weight:bold;letter-spacing:1.5px;">THANK YOU FOR YOUR PURCHASE</div>
    </div>
  </div>
</div>`;
}
