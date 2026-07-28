import { headers } from "next/headers";
import { redirect } from "next/navigation";
import App from "@/src/App";

export default async function HomePage() {
  const host = (await headers()).get("host") ?? "";
  if (host.toLowerCase().startsWith("status.mokshabase.com")) redirect("/status");
  return <App />;
}
