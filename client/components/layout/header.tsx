import { Show, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Header() {
  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center pt-4 px-4 pointer-events-none">
      <header className="pointer-events-auto w-full max-w-5xl h-14 bg-background/80 backdrop-blur-xl border border-border/40 rounded-full flex items-center justify-between px-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="bg-amber-100 dark:bg-amber-500/20 p-1.5 rounded-lg group-hover:scale-105 transition-transform duration-300 w-8 h-auto flex items-center justify-center">
            <Logo />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">
            PDF.ai
          </span>
        </Link>


        {/* AUTH / ACTIONS */}
        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex rounded-full hover:bg-muted/50" asChild>
              <Link href="/sign-in">Log in</Link>
            </Button>
            <Button size="sm" className="rounded-full bg-amber-500 text-slate-900 hover:bg-amber-400 font-semibold shadow-none border border-amber-600/20" asChild>
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </Show>

          <Show when="signed-in">
            <div className="flex items-center gap-4">
              <Link href="/upload" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                Dashboard
              </Link>
              <div className="h-4 w-px bg-border/50 hidden sm:block"></div>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 ring-2 ring-border/50 ring-offset-1 ring-offset-background transition-all hover:ring-amber-500/50",
                  },
                }}
              />
              <ThemeToggle />
            </div>
          </Show>
          
          <Show when="signed-out">
             <div className="ml-2">
                 <ThemeToggle />
             </div>
          </Show>
        </div>
      </header>
    </div>
  );
}
