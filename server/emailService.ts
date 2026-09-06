/**
 * Brevo Email Service Preparation for Kominote Online
 * 
 * Reusable notification service ready for Brevo transactional email API integration.
 * In development or when BREVO_API_KEY is not configured, it logs formatted email events.
 */

export interface EmailPayload {
  to: string;
  toName: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  metadata?: Record<string, any>;
}

export async function sendEmailWithBrevo(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
  const apiKey = process.env.BREVO_API_KEY;

  if (apiKey) {
    try {
      // Official Brevo v3 Transactional Email REST endpoint
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: 'Kominote Online',
            email: process.env.BREVO_SENDER_EMAIL || 'support@kominote.online'
          },
          to: [{ email: payload.to, name: payload.toName }],
          subject: payload.subject,
          htmlContent: payload.htmlContent,
          textContent: payload.textContent,
          tags: ['kominote-digital-shop']
        })
      });

      if (!response.ok) {
        const errData = await response.text();
        console.error('[Brevo Email Error]:', errData);
        return { success: false };
      }

      const resData = (await response.json()) as any;
      console.log(`[Brevo Email Sent] To: ${payload.to}, Subject: ${payload.subject}, ID: ${resData?.messageId}`);
      return { success: true, messageId: resData?.messageId };
    } catch (err) {
      console.error('[Brevo Service Exception]:', err);
      return { success: false };
    }
  }

  // Prepared fallback when Brevo key is pending configuration
  console.log(`\n📧 [SIMULATED BREVO EMAIL NOTIFICATION]`);
  console.log(`To: ${payload.toName} <${payload.to}>`);
  console.log(`Subject: ${payload.subject}`);
  console.log(`Status: Ready for Brevo API Dispatch`);
  console.log(`--------------------------------------------------\n`);
  return { success: true, simulated: true };
}

/**
 * 1. ORDER RECEIVED EMAIL EVENT
 * Subject: "Nou resevwa kòmand ou — Kominote Online"
 */
export async function sendOrderReceivedEmail(order: any, invoiceUrl?: string) {
  const itemsHtml = (order.items || [])
    .map(
      (item: any) =>
        `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.productTitle} (x${item.quantity})</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">$${Number(item.totalPrice).toFixed(2)} ${order.currency || 'USD'}</td>
        </tr>`
    )
    .join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
      <div style="background: #0056D2; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Kominote Online</h1>
        <p style="color: #bfdbfe; margin: 6px 0 0 0; font-size: 14px;">Boutik Pwodwi Dijital</p>
      </div>
      <div style="padding: 30px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="color: #0f172a; margin-top: 0;">Bonjou ${order.customerName || 'Chè Kliyan'},</h2>
        <p>Nou byen resevwa demann kòmand ou a sou <strong>Kominote Online</strong>.</p>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Nimewo Kòmand:</strong> ${order.orderNumber}</p>
          ${order.trackingNumber ? `<p style="margin: 0 0 8px 0;"><strong>Nimewo Swivi:</strong> <span style="font-family: monospace; font-weight: bold; color: #0056D2;">${order.trackingNumber}</span></p>` : ''}
          <p style="margin: 0 0 8px 0;"><strong>Metòd Peman:</strong> ${order.paymentMethod}</p>
          ${order.couponCode ? `<p style="margin: 0 0 8px 0;"><strong>Kòd Rabè:</strong> <span style="font-family: monospace; color: #16a34a;">${order.couponCode}</span></p>` : ''}
          <p style="margin: 0 0 8px 0;"><strong>Estati Peman:</strong> <span style="color: #d97706; font-weight: bold;">Ap tann verifikasyon</span></p>
          <p style="margin: 0;"><strong>Estati Kòmand:</strong> <span style="color: #d97706; font-weight: bold;">Ap tann apwobasyon</span></p>
        </div>

        <h3 style="margin-top: 24px; border-bottom: 2px solid #0056D2; padding-bottom: 6px;">Pwodwi yo</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 14px;">
          ${itemsHtml}
          <tr>
            <td style="padding: 12px 10px; font-weight: bold;">Total:</td>
            <td style="padding: 12px 10px; text-align: right; font-weight: 800; font-size: 16px; color: #0056D2;">$${Number(order.total).toFixed(2)} ${order.currency || 'USD'}</td>
          </tr>
        </table>

        <div style="background: #eff6ff; border-left: 4px solid #0056D2; padding: 14px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #1e40af;">
            <strong>Nòt Enpòtan:</strong> Nou resevwa demand ou a. Aksè oswa telechajman pwodwi dijital la ap disponib apre administrasyon Kominote Online konfime peman an.
          </p>
        </div>

        ${
          invoiceUrl
            ? `<div style="text-align: center; margin: 30px 0;">
                 <a href="${invoiceUrl}" style="background: #0056D2; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Wè Facti / Invoice Ou</a>
               </div>`
            : ''
        }

        <p style="font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Si ou gen nenpòt kesyon, kontakte ekip sipò Kominote Online sou WhatsApp oswa pa imèl.
        </p>
      </div>
    </div>
  `;

  return sendEmailWithBrevo({
    to: order.email,
    toName: order.customerName,
    subject: 'Nou resevwa kòmand ou — Kominote Online',
    htmlContent,
  });
}

/**
 * 2. ORDER APPROVED EMAIL EVENT
 * Subject: "Kòmand ou konfime — Kominote Online"
 */
export async function sendOrderApprovedEmail(order: any, dashboardUrl?: string) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
      <div style="background: #16a34a; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Kominote Online</h1>
        <p style="color: #dcfce7; margin: 6px 0 0 0; font-size: 14px;">Kòmand Konfime & Apwouve!</p>
      </div>
      <div style="padding: 30px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="color: #0f172a; margin-top: 0;">Felisitasyon ${order.customerName || 'Chè Kliyan'}!</h2>
        <p>Nou kontan enfòme w ke peman pou kòmand <strong>${order.orderNumber}</strong> te konfime avèk siksè pa administrasyon Kominote Online.</p>
        
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Nimewo Kòmand:</strong> ${order.orderNumber}</p>
          ${order.trackingNumber ? `<p style="margin: 0 0 8px 0;"><strong>Nimewo Swivi:</strong> <span style="font-family: monospace; font-weight: bold; color: #16a34a;">${order.trackingNumber}</span></p>` : ''}
          <p style="margin: 0 0 8px 0;"><strong>Estati Peman:</strong> <span style="color: #16a34a; font-weight: bold;">Peye (Konfime)</span></p>
          <p style="margin: 0;"><strong>Estati Telechajman:</strong> <span style="color: #16a34a; font-weight: bold;">Pare pou telechaje</span></p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl || 'https://kominote.online/dashboard/downloads'}" style="background: #16a34a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Aksede ak Telechaje Pwodwi Ou</a>
        </div>

        <p style="font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Mèsi pou konfyans ou nan Kominote Online!
        </p>
      </div>
    </div>
  `;

  return sendEmailWithBrevo({
    to: order.email,
    toName: order.customerName,
    subject: 'Kòmand ou konfime — Kominote Online',
    htmlContent,
  });
}

/**
 * 3. ORDER REJECTED EMAIL EVENT
 */
export async function sendOrderRejectedEmail(order: any, reason?: string) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
      <div style="background: #dc2626; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Kominote Online</h1>
      </div>
      <div style="padding: 30px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="color: #0f172a; margin-top: 0;">Bonjou ${order.customerName || 'Chè Kliyan'},</h2>
        <p>Nou regrèt fè w konnen kòmand <strong>${order.orderNumber}</strong> pa t kapab apwouve.</p>
        
        ${reason ? `<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0; color: #991b1b;"><p style="margin:0;"><strong>Rezon:</strong> ${reason}</p></div>` : ''}

        <p>Tanpri verifye prèv peman an oswa kontakte administrasyon an pou plis detay.</p>
      </div>
    </div>
  `;

  return sendEmailWithBrevo({
    to: order.email,
    toName: order.customerName,
    subject: 'Mete ajou sou kòmand ou — Kominote Online',
    htmlContent,
  });
}

/**
 * 4. DOWNLOAD ENABLED EMAIL EVENT
 * Subject: "Pwodwi ou pare pou telechaje — Kominote Online"
 */
export async function sendDownloadEnabledEmail(order: any, downloadsUrl?: string) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
      <div style="background: #0056D2; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Kominote Online</h1>
      </div>
      <div style="padding: 30px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="color: #0f172a; margin-top: 0;">Bonjou ${order.customerName || 'Chè Kliyan'},</h2>
        <p>Aksè telechajman pou pwodwi dijital ou yo nan kòmand <strong>${order.orderNumber}</strong> pare kounye a!</p>
        
        <p>Pou rezon sekirite, nou pa voye fichye yo kòm atachman imèl. Ou ka telechaje yo dirèkteman nan espas kliyan ou a anba a:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${downloadsUrl || 'https://kominote.online/dashboard/downloads'}" style="background: #0056D2; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ale nan Telechajman Mwen yo</a>
        </div>
      </div>
    </div>
  `;

  return sendEmailWithBrevo({
    to: order.email,
    toName: order.customerName,
    subject: 'Pwodwi ou pare pou telechaje — Kominote Online',
    htmlContent,
  });
}

/**
 * 5. INVOICE CREATED EMAIL EVENT
 */
export async function sendInvoiceEmail(order: any, invoice: any, invoiceUrl: string) {
  return sendOrderReceivedEmail(order, invoiceUrl);
}
