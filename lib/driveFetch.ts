import https from "node:https";

/**
 * Fetches a URL via Node's `https` module, forced to IPv4.
 *
 * Node's built-in `fetch` (undici) tries IPv6 first on this network and
 * hangs for several seconds before giving up with ETIMEDOUT when talking
 * to Google's Drive/usercontent hosts — `curl` (which prefers IPv4 here)
 * connects instantly. Forcing `family: 4` sidesteps that entirely.
 *
 * Follows redirects itself (Drive's download/view endpoints redirect at
 * least once) and resolves with the final response's status, headers, and
 * body as a Buffer.
 */
export function driveFetch(
  url: string,
  redirectsLeft = 5
): Promise<{ status: number; headers: NodeJS.Dict<string | string[]>; body: Buffer }> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { family: 4 }, (res) => {
        const { statusCode, headers } = res;
        if (
          statusCode &&
          [301, 302, 303, 307, 308].includes(statusCode) &&
          headers.location &&
          redirectsLeft > 0
        ) {
          res.resume(); // drain this response before following the redirect
          driveFetch(headers.location, redirectsLeft - 1).then(resolve, reject);
          return;
        }

        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({ status: statusCode ?? 502, headers, body: Buffer.concat(chunks) })
        );
        res.on("error", reject);
      })
      .on("error", reject);
  });
}
