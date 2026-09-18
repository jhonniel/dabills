import { redirect } from "next/navigation";

/** Users cannot create subscriptions — only admins assign them. */
export default function NewSubscriptionPage() {
  redirect("/dashboard/subscriptions");
}
