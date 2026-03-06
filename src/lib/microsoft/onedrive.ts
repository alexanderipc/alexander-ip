/**
 * OneDrive folder creation via Microsoft Graph API.
 * Creates a standardized folder structure for each project.
 */

import { getAccessToken } from "./auth";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

const SUBFOLDERS = [
  "Drafts",
  "Correspondence",
  "Filing Receipts",
  "Search Reports",
];

interface DriveItem {
  id: string;
  name: string;
  webUrl: string;
}

/**
 * Create the full project folder structure in OneDrive.
 * Returns the web URL of the project folder, or null on failure.
 *
 * Folder path: Portal Projects / {clientName} - {projectTitle} / subfolders
 */
export async function createProjectFolders(
  clientName: string,
  projectTitle: string
): Promise<string | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error("[OneDrive] No access token — skipping folder creation");
    return null;
  }

  try {
    // 1. Ensure "Portal Projects" parent folder exists
    const parentFolder = await ensureFolder(
      accessToken,
      "root",
      "Portal Projects"
    );
    if (!parentFolder) {
      console.error("[OneDrive] Failed to create/find Portal Projects folder");
      return null;
    }

    // 2. Create the project folder
    const folderName = sanitizeFolderName(`${clientName} - ${projectTitle}`);
    const projectFolder = await ensureFolder(
      accessToken,
      parentFolder.id,
      folderName
    );
    if (!projectFolder) {
      console.error("[OneDrive] Failed to create project folder:", folderName);
      return null;
    }

    // 3. Create subfolders in parallel
    await Promise.all(
      SUBFOLDERS.map((name) =>
        ensureFolder(accessToken, projectFolder.id, name)
      )
    );

    console.log(
      "[OneDrive] Created folder structure:",
      projectFolder.webUrl
    );
    return projectFolder.webUrl;
  } catch (err) {
    console.error("[OneDrive] Folder creation error:", err);
    return null;
  }
}

/**
 * Ensure a folder exists as a child of parentItemId.
 * Creates it if it doesn't exist; returns the existing one if it does.
 */
async function ensureFolder(
  accessToken: string,
  parentItemId: string,
  folderName: string
): Promise<DriveItem | null> {
  const parentPath =
    parentItemId === "root"
      ? `/me/drive/root/children`
      : `/me/drive/items/${parentItemId}/children`;

  const res = await fetch(`${GRAPH_BASE}${parentPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      folder: {},
      "@microsoft.graph.conflictBehavior": "useExisting",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(
      `[OneDrive] Failed to create folder "${folderName}":`,
      res.status,
      body
    );
    return null;
  }

  return (await res.json()) as DriveItem;
}

/**
 * Remove characters that OneDrive doesn't allow in folder names.
 */
function sanitizeFolderName(name: string): string {
  // OneDrive forbidden chars: " * : < > ? / \ |
  return name.replace(/["*:<>?/\\|]/g, "_").replace(/\s+/g, " ").trim();
}
