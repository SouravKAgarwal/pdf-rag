import { Button } from "@/components/ui/button";
import { Show } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

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
    <>
      <section className="p-6 md:p-32 bg-[#062427] min-h-svh text-white">
        <div className="flex flex-col max-w-187.5 gap-6">
          <h1 className="text-5xl font-medium font-serif">
            Chat With any PDF document
          </h1>
          <span className="text-lg font-sans">
            From legal agreements to financial reports, PDF.ai brings your
            documents to life. You can ask questions, get summaries, find
            information, and more.
          </span>
        </div>

        <div className="mt-6">
          <Show when="signed-out">
            <Button
              variant="secondary"
              size="lg"
              className="bg-amber-600 text-white hover:bg-amber-700 font-semibold"
            >
              Get Started for FREE
            </Button>
          </Show>
          <Show when="signed-in">
            <Button
              variant="secondary"
              size="lg"
              className="bg-amber-600 text-white hover:bg-amber-700 font-semibold"
              asChild
            >
              <Link href="/upload">Upload PDF</Link>
            </Button>
          </Show>
        </div>

        <div className="flex justify-start mt-6">
          {USERS_PIC.map((avatar, index) => (
            <Image
              key={index}
              className="relative z-30 inline-block h-6 w-6 my-auto object-cover rounded-full ring-2 ring-green-950"
              src={avatar.src}
              width={6}
              height={6}
              alt=""
            />
          ))}
          <p className="ml-2 my-auto">Loved by millions of happy users!</p>
        </div>
      </section>

      <section className="border border-t-[rgb(229, 227, 218)]">
        <div className="p-6 md:p-24 bg-[#f8f5ee] text-black">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="p-3">
              <Image
                src="/upload-doc.svg"
                width={400}
                height={400}
                alt="upload-document"
              />
              <h1 className="border-t pt-6 pb-3 text-3xl font-serif">
                Upload Documents
              </h1>
              <span>
                Easily upload the PDF documents you&apos;d like to chat with.
              </span>
            </div>
            <div className="p-3">
              <Image
                src="/instant-answers.svg"
                width={400}
                height={400}
                alt="instant-answers"
              />
              <h1 className="border-t pt-6 pb-3 text-3xl font-serif">
                Instant answers
              </h1>
              <span>
                Ask questions, extract information, and summarize documents with
                AI.
              </span>
            </div>
            <div className="p-3">
              <Image
                src="/sources-cited.svg"
                width={400}
                height={400}
                alt="sources-cited"
              />
              <h1 className="border-t pt-6 pb-3 text-3xl font-serif">
                Sources included
              </h1>
              <span>
                Every response is backed by sources extracted from the uploaded
                document.
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
