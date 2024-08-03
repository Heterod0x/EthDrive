const url =
  "https://api.stackup.sh/v1/node/db0628b8adb25de7ff8bb79c5f7dc94aee8fa9144d66a589b04abc7e0d4489ad";

export async function request(_: string, method: string, params: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method,
      params,
    }),
  });
  return await res.json();
}
