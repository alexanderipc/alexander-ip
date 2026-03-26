"use client";

import { useEffect } from "react";

/**
 * Invisible component that records when a client visits their project page.
 * Fires once on mount — the API endpoint updates `last_client_visit` on the project.
 */
export default function PortalVisitTracker({ projectId }: { projectId: string }) {
  useEffect(() => {
    // Fire-and-forget — don't block or show errors to client
    fetch(`/api/portal/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    }).catch(() => {
      // Silently ignore
    });
  }, [projectId]);

  return null;
}
