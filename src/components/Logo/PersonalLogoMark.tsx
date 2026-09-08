type PersonalLogoMarkProps = {
  className?: string;
  size?: number;
};

export function PersonalLogoMark({ className, size = 64 }: PersonalLogoMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="32" cy="4" r="4" fill="currentColor" />
      <circle cx="18" cy="18" r="4" fill="var(--text-accent)" />
      <circle cx="46" cy="18" r="4" fill="var(--text-accent)" />
      <circle cx="4" cy="32" r="4" fill="currentColor" />
      <circle cx="18" cy="32" r="4" fill="currentColor" />
      <circle cx="32" cy="32" r="4" fill="currentColor" />
      <circle cx="46" cy="32" r="4" fill="currentColor" />
      <circle cx="60" cy="32" r="4" fill="currentColor" />
      <circle cx="32" cy="46" r="4" fill="currentColor" />
      <circle cx="4" cy="60" r="4" fill="var(--text-accent)" />
      <circle cx="32" cy="60" r="4" fill="currentColor" />
      <circle cx="60" cy="60" r="4" fill="var(--text-accent)" />
    </svg>
  );
}
