import { Button } from "@/components/ui/button";
import { Show } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "AI PDF Ly - Chat with any PDF document",
  description:
    "Upload your PDF documents and ask questions, get summaries, and extract information instantly using AI.",
};

const USERS_PIC = [
  { src: "/assets/rita.jpg" },
  { src: "/assets/christina.jpg" },
  { src: "/assets/courtney.jpg" },
  { src: "/assets/irene.jpg" },
  { src: "/assets/etty.jpg" },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#fdfcfa]">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#062427] text-white pt-28 pb-28 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-serif leading-tight tracking-tight max-w-4xl mx-auto mb-6">
            Chat with any <span className="text-amber-400">PDF document</span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 font-light max-w-2xl mx-auto mb-10">
            From legal agreements to financial reports, bring your documents to
            life. Ask questions, get summaries, and find information instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Suspense fallback={<div className="h-14 w-32" />}>
              <Show when="signed-out">
                <Button
                  variant="secondary"
                  className="bg-amber-500 text-slate-900 hover:bg-amber-400 font-semibold px-8 py-6 rounded-full"
                  asChild
                >
                  <Link href="/sign-up">Get Started for FREE</Link>
                </Button>
              </Show>
              <Show when="signed-in">
                <Button
                  variant="secondary"
                  className="bg-amber-500 text-slate-900 hover:bg-amber-400 font-semibold px-8 py-6 rounded-full"
                  asChild
                >
                  <Link href="/upload">Upload PDF</Link>
                </Button>
              </Show>
            </Suspense>
          </div>

          <div className="flex items-center justify-center gap-3 mt-12 opacity-80">
            <div className="flex -space-x-3">
              {USERS_PIC.map((avatar, index) => (
                <Image
                  key={index}
                  className="inline-block h-8 w-8 object-cover rounded-full ring-2 ring-[#062427]"
                  src={avatar.src}
                  width={32}
                  height={32}
                  alt={`User ${index + 1}`}
                />
              ))}
            </div>
            <p className="text-sm">Loved by millions of happy users</p>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center gap-4 group">
            <div className="w-full max-w-[240px] mb-2 group-hover:-translate-y-2 transition-transform duration-300">
              <Image
                src="/upload-doc.svg"
                width={400}
                height={400}
                alt="Upload Documents"
                className="w-full h-auto"
              />
            </div>
            <h3 className="text-2xl font-serif font-semibold text-slate-900">
              Upload Documents
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Easily upload the PDF documents you&apos;d like to chat with. We
              securely process your files for instant analysis.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 group">
            <div className="w-full max-w-[240px] mb-2 group-hover:-translate-y-2 transition-transform duration-300">
              <Image
                src="/instant-answers.svg"
                width={400}
                height={400}
                alt="Instant Answers"
                className="w-full h-auto"
              />
            </div>
            <h3 className="text-2xl font-serif font-semibold text-slate-900">
              Instant Answers
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Ask questions, extract information, and summarize complex
              documents in seconds with advanced AI.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 group">
            <div className="w-full max-w-[240px] mb-2 group-hover:-translate-y-2 transition-transform duration-300">
              <Image
                src="/sources-cited.svg"
                width={400}
                height={400}
                alt="Sources Included"
                className="w-full h-auto"
              />
            </div>
            <h3 className="text-2xl font-serif font-semibold text-slate-900">
              Sources Included
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Every response is backed by exact sources extracted directly from
              your uploaded document for complete trust.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
