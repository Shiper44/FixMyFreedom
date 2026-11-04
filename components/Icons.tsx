// Sprite de iconos SVG. Se inserta una vez en el layout y se usa con <Icon name="..." />.
export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="logo-m" viewBox="0 0 892 814">
        <polygon points="0,0 446,348 892,0 892,198 446,548 0,198" />
        <polygon points="0,285 384,586 384,770 146,581 146,814 0,814" />
        <polygon points="892,285 508,586 508,770 746,581 746,814 892,814" />
      </symbol>
      <symbol id="i-web" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></symbol>
      <symbol id="i-chat" viewBox="0 0 24 24"><path d="M4 19.5l1.2-3.6A8 8 0 1 1 8.4 19z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M9 10.5h6M9 13.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></symbol>
      <symbol id="i-send" viewBox="0 0 24 24"><path d="M21 3L3 10.5l7 2.5 2.5 7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M10 13l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></symbol>
      <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></symbol>
      <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></symbol>
    </svg>
  );
}

export type IconName = "logo-m" | "i-web" | "i-chat" | "i-send" | "i-mail" | "i-check";

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={className} aria-hidden="true">
      <use href={`#${name}`} />
    </svg>
  );
}
