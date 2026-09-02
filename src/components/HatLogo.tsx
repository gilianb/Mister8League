export default function HatLogo({ className = "w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 76" className={className} aria-hidden="true">
      <path d="M24 56 C24 22 96 22 96 56 Z" fill="#F6C36B" />
      <path d="M26 56 C26 45 94 45 94 56 Z" fill="#E8392B" />
      <ellipse cx="60" cy="57" rx="56" ry="15" fill="#F6C36B" />
    </svg>
  );
}
