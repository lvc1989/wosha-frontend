// Generates a real WhatsApp "click to chat" link (wa.me). This opens WhatsApp with the
// message pre-filled, ready to send — the person still taps Send themselves. This is the
// real, no-account-needed way to integrate WhatsApp from a web app. Fully automated,
// server-initiated sending (no tap required) needs a paid, Meta-approved WhatsApp
// Business API account, which requires you to sign up with Meta directly — not
// something that can be wired in without your own business verification.
export function whatsappLink(phone, message) {
  const digits = (phone || "").replace(/[^\d]/g, "");
  const text = encodeURIComponent(message || "");
  return `https://wa.me/${digits}?text=${text}`;
}
