"use client";

import NotificationMuteToggle from "@/components/ui/NotificationMuteToggle";
import { toggleClientNotificationMute } from "@/app/portal/actions";

interface Props {
  projectId: string;
  muted: boolean;
}

export default function ClientNotificationMute({ projectId, muted }: Props) {
  return (
    <NotificationMuteToggle
      projectId={projectId}
      muted={muted}
      label="Pause email notifications"
      action={toggleClientNotificationMute}
    />
  );
}
