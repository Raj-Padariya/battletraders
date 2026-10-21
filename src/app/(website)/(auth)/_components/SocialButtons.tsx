"use client";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Google / Telegram buttons shared by login and signup; sign-in is not wired yet, so the page shows a notice.
export default function SocialButtons({ onPick }: { onPick: (notice: string) => void }) {
  const pick = (provider: string) => onPick(provider + " sign-in is coming soon. Use your email for now.");
  return (
    <div className="auth-social">
      <button className="social-btn" type="button" data-provider="Google" onClick={() => pick("Google")}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
          <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.4V7H2.1a11 11 0 0 0 0 10l3.7-2.8z" />
          <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
        </svg>
        Google
      </button>
      <button className="social-btn" type="button" data-provider="Telegram" onClick={() => pick("Telegram")}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="#229ED9" />
          <path
            fill="#fff"
            d="m5.4 11.7 11.8-4.6c.6-.2 1 .1.9.9l-2 9.5c-.1.7-.6.9-1.2.5l-3.1-2.3-1.5 1.4c-.2.2-.3.3-.6.3l.2-3.1 5.7-5.1c.2-.2 0-.3-.4-.1l-7 4.4-3-.9c-.7-.2-.7-.6.2-.9z"
          />
        </svg>
        Telegram
      </button>
    </div>
  );
}
