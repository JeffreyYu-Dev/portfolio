import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <div className="grid h-full place-items-center p-10 text-center text-[#444746]">
      <div>
        <p className="text-sm">This message doesn't exist</p>
        <Link
          to="/yail/$box"
          params={{ box: "inbox" }}
          className="mt-2 inline-block text-[#0b57d0] hover:underline"
        >
          Back to Inbox
        </Link>
      </div>
    </div>
  );
}
