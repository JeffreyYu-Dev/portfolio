// our own take on a colourful envelope, a Y folded into it. not google's logo
export function YailMark() {
  return (
    <span className="flex items-center gap-2">
      <svg
        viewBox="0 0 40 30"
        aria-hidden="true"
        className="h-5 w-6"
        fill="none"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 26V6" stroke="#4285f4" />
        <path d="M35 26V6" stroke="#34a853" />
        <path d="M5 6l15 11L35 6" stroke="#ea4335" />
        <path d="M20 17v9" stroke="#fbbc04" />
      </svg>
      <span className="text-base text-[#444746]">Yail</span>
    </span>
  );
}
