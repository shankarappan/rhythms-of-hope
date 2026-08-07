import { headers } from "next/headers";
import { redirect } from "next/navigation";
import App from "@/src/App";

export default async function HomePage() {
  const host = (await headers()).get("host") ?? "";
  if (host.toLowerCase().startsWith("status.mokshabase.com")) redirect("/status");
  if (host.toLowerCase().startsWith("orders.mokshabase.com")) redirect("/orders");
  return <App />;
}
