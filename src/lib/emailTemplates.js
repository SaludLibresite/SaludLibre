/**
 * Salud Libre - Email Template Utilities
 * Shared branding and template functions for all transactional emails
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.saludlibre.com.ar";
const LOGO_URL = `${APP_URL}/logo.png`;

// Salud Libre brand colors
const BRAND = {
  primary: "#f59e0b",      // amber-500
  primaryDark: "#d97706",   // amber-600
  primaryLight: "#fef3c7",  // amber-100
  secondary: "#1e293b",     // slate-800
  accent: "#10b981",        // emerald-500
  accentLight: "#d1fae5",   // emerald-100
  textDark: "#1f2937",      // gray-800
  textMuted: "#6b7280",     // gray-500
  bgLight: "#f9fafb",       // gray-50
  border: "#e5e7eb",        // gray-200
  white: "#ffffff",
};

/**
 * Base email layout with Salud Libre branding
 */
export function emailLayout({ title, preheader, body }) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${title}</title>
      ${preheader ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ""}
      <!--[if mso]>
      <style type="text/css">
        body, table, td { font-family: Arial, sans-serif !important; }
      </style>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
        <tr>
          <td align="center" style="padding: 24px 16px;">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: ${BRAND.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%); padding: 32px 40px; text-align: center;">
                  <img src="${LOGO_URL}" alt="Salud Libre" width="180" style="max-width: 180px; height: auto; margin-bottom: 16px;" />
                  <h1 style="margin: 0; color: ${BRAND.white}; font-size: 22px; font-weight: 700; letter-spacing: -0.025em;">${title}</h1>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 32px 40px;">
                  ${body}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: ${BRAND.bgLight}; padding: 24px 40px; border-top: 1px solid ${BRAND.border};">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <img src="${LOGO_URL}" alt="Salud Libre" width="120" style="max-width: 120px; height: auto; opacity: 0.7; margin-bottom: 12px;" />
                        <p style="margin: 0 0 8px; color: ${BRAND.textMuted}; font-size: 13px;">
                          Tu plataforma de confianza para servicios médicos
                        </p>
                        <p style="margin: 0 0 8px; color: ${BRAND.textMuted}; font-size: 12px;">
                          <a href="${APP_URL}" style="color: ${BRAND.primary}; text-decoration: none;">www.saludlibre.com.ar</a>
                          &nbsp;·&nbsp;
                          <a href="mailto:contacto@saludlibre.com.ar" style="color: ${BRAND.primary}; text-decoration: none;">contacto@saludlibre.com.ar</a>
                        </p>
                        <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                          Este es un correo automático, por favor no respondas a este mensaje.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Styled CTA button
 */
export function ctaButton(text, url, color = BRAND.primary) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px auto;">
      <tr>
        <td align="center" style="background: ${color}; border-radius: 8px;">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; color: ${BRAND.white}; font-size: 15px; font-weight: 600; text-decoration: none; letter-spacing: 0.025em;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Info card / detail box
 */
export function detailCard(title, rows, borderColor = BRAND.primary, bgColor = BRAND.primaryLight) {
  const rowsHtml = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: ${BRAND.textDark}; width: 140px; font-size: 14px; vertical-align: top;">${label}</td>
          <td style="padding: 8px 0; color: ${BRAND.textDark}; font-size: 14px;">${value}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="background: ${bgColor}; border-left: 4px solid ${borderColor}; border-radius: 8px; padding: 20px 24px; margin: 20px 0;">
      <h3 style="margin: 0 0 12px; color: ${BRAND.secondary}; font-size: 16px; font-weight: 600;">${title}</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${rowsHtml}
      </table>
    </div>
  `;
}

/**
 * Status badge
 */
export function statusBadge(text, bgColor, textColor) {
  return `<span style="display: inline-block; padding: 4px 12px; background: ${bgColor}; color: ${textColor}; border-radius: 20px; font-size: 13px; font-weight: 600;">${text}</span>`;
}

/**
 * Alert/info box
 */
export function infoBox(content, type = "info") {
  const styles = {
    info: { bg: "#eff6ff", border: "#3b82f6", color: "#1e40af" },
    warning: { bg: "#fffbeb", border: "#f59e0b", color: "#92400e" },
    success: { bg: "#f0fdf4", border: "#10b981", color: "#065f46" },
    error: { bg: "#fef2f2", border: "#ef4444", color: "#991b1b" },
  };
  const s = styles[type] || styles.info;

  return `
    <div style="background: ${s.bg}; border-left: 4px solid ${s.border}; border-radius: 8px; padding: 16px 20px; margin: 20px 0; color: ${s.color}; font-size: 14px; line-height: 1.6;">
      ${content}
    </div>
  `;
}

/**
 * Format date for display in emails
 */
export function formatDate(dateString) {
  if (!dateString) return "Fecha por confirmar";
  try {
    const date = new Date(dateString);
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("es-AR", options);
  } catch {
    return dateString;
  }
}

export { APP_URL, BRAND };
