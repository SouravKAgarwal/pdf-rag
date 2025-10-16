import { SignUp } from "@clerk/nextjs";
import { JSX } from "react";

export function generateStaticParams() {
  const param = `SignUp_clerk_catchall_check_${Date.now()}`;
  return [{ "sign-up": [param] }];
}

export default function SignupPage(): JSX.Element {
  return (
    <div className="h-[calc(100svh-52px)] flex justify-center items-center">
      <SignUp />
    </div>
  );
}
