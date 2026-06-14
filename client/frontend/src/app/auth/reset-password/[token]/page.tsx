"use client";
import { useParams } from "next/navigation";

function Page() {
  const { token } = useParams();

  return <div>{token}</div>;
}

export default Page;
