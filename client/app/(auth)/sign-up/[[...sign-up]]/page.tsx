import { SignUp } from "@clerk/nextjs";
import { JSX, Suspense } from "react";

export default function SignupPage(): JSX.Element {
  return (
    <div className="h-[calc(100svh-52px)] flex justify-center items-center">
      <Suspense fallback={<div>Loading...</div>}>
        <SignUp />
      </Suspense>
    </div>
  );
}
