import { apiGet, apiPost } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

interface SignedUpload {
  bucket: string;
  path: string;
  token: string;
}

export async function uploadPrivateFile(signPath: string, confirmPath: string, file: File): Promise<void> {
  const sign = await apiPost<SignedUpload>(signPath, { name: file.name });
  const { error } = await getSupabase()
    .storage.from(sign.bucket)
    .uploadToSignedUrl(sign.path, sign.token, file, {
      contentType: file.type || "application/octet-stream",
    });
  if (error) throw new Error(error.message);
  await apiPost(confirmPath, { path: sign.path });
}

export async function fetchPrivateUrl(path: string): Promise<string> {
  const data = await apiGet<{ url: string }>(path);
  return data.url;
}
