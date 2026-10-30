import { get, put } from "@vercel/blob";
import { digest } from "./normalize";
export interface OriginalStore {
  put(path: string, body: string): Promise<{ path: string }>;
  get(path: string): Promise<string>;
}
/** No public URL is exposed; private Blob reads always require server credentials. */
export function createBlobOriginalStore(): OriginalStore {
  return {
    async put(path, body) {
      const result = await put(path, body, {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: "application/octet-stream",
      }).catch(async (error) => {
        // Content-addressed retries may encounter an existing original. Verify rather than overwrite it.
        const existing = await get(path, { access: "private" });
        if (existing?.statusCode !== 200) throw error;
        const text = await new Response(existing.stream).text();
        if (digest(text) !== digest(body)) throw error;
        return { pathname: path };
      });
      return { path: result.pathname };
    },
    async get(path) {
      const result = await get(path, { access: "private" });
      if (!result || result.statusCode !== 200)
        throw new Error(`Missing private original ${path}`);
      return new Response(result.stream).text();
    },
  };
}
