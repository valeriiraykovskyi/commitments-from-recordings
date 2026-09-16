import { upload } from "@vercel/blob/client";

/**
 * Sends the file straight from the browser to the Blob store, with a
 * short-lived token from our upload route. Resolves to the Blob pathname
 * that the process route reads and then deletes.
 */
export async function uploadRecording(
  file: File,
  pathname: string,
  contentType: string,
  onProgress: (fraction: number) => void,
): Promise<string> {
  try {
    const blob = await upload(pathname, file, {
      access: "private",
      handleUploadUrl: "/api/upload",
      contentType,
      onUploadProgress: ({ percentage }) => onProgress(percentage / 100),
    });
    return blob.pathname;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    throw new Error(detail ? `Upload failed: ${detail}` : "Upload failed. Please try again.");
  }
}
