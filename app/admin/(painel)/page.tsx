import { redirect } from "next/navigation";

/** Fallback: o redirect principal de /admin está em next.config.ts. */
export default function AdminHome() {
  redirect("/admin/palcos");
}
