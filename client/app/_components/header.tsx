import { Show, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 h-[60px] bg-background border-b border-border flex items-center justify-between px-5">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" alt="PDF AI" width={24} height={24} />
        <span className="font-semibold text-sm tracking-tight text-foreground">
          PDF.ai
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <Show when="signed-out">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sign-in">Log in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/sign-up">Sign up</Link>
          </Button>
        </Show>

        <Show when="signed-in">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-7 w-7",
              },
            }}
          />
        </Show>
      </div>
    </header>
  );
}
