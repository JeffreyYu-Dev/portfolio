// gmail's logo next to the name
export function YailMark() {
  return (
    <span className="flex items-center gap-2">
      <YailIcon className="h-5 w-6" />
      <span className="text-base text-[#444746]">Yail</span>
    </span>
  );
}

// just the logo, e.g. for the browser tab's favicon
export function YailIcon({ className }: { className: string }) {
  return (
    <img src="/gmail.webp" alt="" className={`object-contain ${className}`} />
  );
}
