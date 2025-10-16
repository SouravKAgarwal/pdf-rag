import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white backdrop-blur-md border-b border-[#1f1f1f] text-black flex justify-between items-center px-6 py-4">
      <Link href="/" className="flex items-center">
        <Image src="/logo.svg" alt="PDF AI" width={28} height={28} />
        <span className="font-semibold text-base tracking-tight">PDF.ai</span>
      </Link>

      <div className="flex items-center gap-3">
        <SignedOut>
          <Link href="/sign-in">
            <Button
              variant="secondary"
              className="rounded-md bg-transparent border border-[#2a2a2a] hover:border-[#3a3a3a] text-[#f8f5ee] hover:bg-[#1a1a1a]"
            >
              Log In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="rounded-md bg-[#f8f5ee] text-black hover:bg-[#e2dfd8]">
              Register
            </Button>
          </Link>
        </SignedOut>

        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        </SignedIn>
      </div>
    </header>
  );
}
