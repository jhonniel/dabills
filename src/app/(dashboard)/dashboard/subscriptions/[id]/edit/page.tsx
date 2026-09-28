import { redirect } from "next/navigation";

/** Users can view subscriptions. Only an admin can change them. */
export default async function EditSubscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/subscriptions/${id}`);
}
