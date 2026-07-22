"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  processDueRemindersAction,
  sendTestReminderAction,
  updateNotificationPreferencesAction,
} from "@/features/notifications/actions";
import type { NotificationPreferences } from "@/validators/notification";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function NotificationPreferencesForm({
  initial,
}: {
  initial: NotificationPreferences;
}) {
  const router = useRouter();
  const [prefs, setPrefs] = useState(initial);
  const [pending, startTransition] = useTransition();

  const toggle = (key: keyof NotificationPreferences) => {
    setPrefs((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="font-display text-lg">Channels</CardTitle>
          <CardDescription>
            Choose how DaBills reaches you for reminders and payment events.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PreferenceRow
            label="Email reminders"
            description="Beautiful HTML emails via Resend"
            checked={prefs.emailEnabled}
            onCheckedChange={() => toggle("emailEnabled")}
          />
          <PreferenceRow
            label="In-app notifications"
            description="Bell center inside the dashboard"
            checked={prefs.inAppEnabled}
            onCheckedChange={() => toggle("inAppEnabled")}
          />
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="font-display text-lg">Reminder timing</CardTitle>
          <CardDescription>
            5 days, 3 days, 1 day before due date, due today, and overdue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PreferenceRow
            label="5 days before"
            checked={prefs.reminder5d}
            onCheckedChange={() => toggle("reminder5d")}
          />
          <PreferenceRow
            label="3 days before"
            checked={prefs.reminder3d}
            onCheckedChange={() => toggle("reminder3d")}
          />
          <PreferenceRow
            label="1 day before"
            checked={prefs.reminder1d}
            onCheckedChange={() => toggle("reminder1d")}
          />
          <PreferenceRow
            label="Due today"
            checked={prefs.dueToday}
            onCheckedChange={() => toggle("dueToday")}
          />
          <PreferenceRow
            label="Overdue"
            checked={prefs.overdue}
            onCheckedChange={() => toggle("overdue")}
          />
          <PreferenceRow
            label="Payment events"
            description="Received / approved notifications"
            checked={prefs.paymentEvents}
            onCheckedChange={() => toggle("paymentEvents")}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          disabled={pending}
          className="rounded-xl bg-gradient-to-r from-cyan-400 to-teal-500 font-semibold text-black"
          onClick={() => {
            startTransition(async () => {
              const result = await updateNotificationPreferencesAction(prefs);
              if (!result.success) {
                toast.error(result.error);
                return;
              }
              toast.success("Preferences saved");
              router.refresh();
            });
          }}
        >
          Save preferences
        </Button>
        <Button
          variant="outline"
          className="rounded-xl"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await sendTestReminderAction();
              if (!result.success) {
                toast.error(result.error);
                return;
              }
              toast.success("Test reminder sent to notification center");
              router.refresh();
            });
          }}
        >
          Send test reminder
        </Button>
        <Button
          variant="outline"
          className="rounded-xl"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await processDueRemindersAction();
              if (!result.success) {
                toast.error(result.error);
                return;
              }
              toast.success(
                `Processed ${result.data?.processed ?? 0} reminders (${result.data?.skipped ?? 0} skipped)`
              );
              router.refresh();
            });
          }}
        >
          Process due reminders
        </Button>
      </div>
    </div>
  );
}

function PreferenceRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
