"use client";

import NotificationMuteToggle from "@/components/ui/NotificationMuteToggle";
import { toggleProjectNotificationMute } from "@/app/admin/actions";

interface Props {
  projectId: string;
  clientMuted: boolean;
  adminMuted: boolean;
}

export default function NotificationMuteControls({
  projectId,
  clientMuted,
  adminMuted,
}: Props) {
  return (
    <div className="space-y-3">
      <NotificationMuteToggle
        projectId={projectId}
        muted={adminMuted}
        label="My notifications"
        action={(id) => toggleProjectNotificationMute(id, "admin")}
      />
      <NotificationMuteToggle
        projectId={projectId}
        muted={clientMuted}
        label="Client emails"
        action={(id) => toggleProjectNotificationMute(id, "client")}
      />
    </div>
  );
}
