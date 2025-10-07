export async function adminApiRequest(
  method: string,
  url: string,
  body?: any
): Promise<Response> {
  const token = localStorage.getItem("adminToken");
  
  if (!token) {
    throw new Error("Admin not authenticated");
  }

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${token}`,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return response;
}
