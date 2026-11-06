// Public site contact details come from env vars, so nothing personal is hard-coded:
//   NEXT_PUBLIC_CONTACT_WHATSAPP  digits with country code, e.g. 919876543210
//   NEXT_PUBLIC_CONTACT_EMAIL     e.g. hello@yourdomain.in
export const CONTACT_WHATSAPP = (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "").replace(/\D/g, "");
export const CONTACT_EMAIL = (process.env.NEXT_PUBLIC_CONTACT_EMAIL || "").trim();

export const SITE_NAME = "Relvnt";

/** Best available "talk to us" link: WhatsApp with a pre-filled message, then email, then the demo. */
export function contactLink(message = "Hi! I'd like a free Instagram check-up.") {
  if (CONTACT_WHATSAPP) return `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(message)}`;
  if (CONTACT_EMAIL) return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Free Instagram check-up")}&body=${encodeURIComponent(message)}`;
  return "/app";
}

export const contactLabel = () => (CONTACT_WHATSAPP ? "WhatsApp us" : CONTACT_EMAIL ? "Email us" : "Try the demo");
