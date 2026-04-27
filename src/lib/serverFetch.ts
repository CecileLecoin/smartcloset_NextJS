export async function serverFetch(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    cache: "no-cache",
  });
}