import { SignIn } from "@clerk/nextjs";
import { JSX } from "react";

export function generateStaticParams() {
  const param = `SignIn_clerk_catchall_check_${Date.now()}`;
  return [{ "sign-in": [param] }];
}

export default function SigninPage(): JSX.Element {
  return (
    <div className="h-[calc(100svh-52px)] flex justify-center items-center">
      <SignIn />
    </div>
  );
}
