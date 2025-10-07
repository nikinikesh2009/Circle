import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "./firebase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

async function getAuthHeaders(forceRefresh = false): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      
      if (user) {
        try {
          const token = await user.getIdToken(forceRefresh);
          resolve({
            "Authorization": `Bearer ${token}`,
          });
        } catch (error) {
          console.error("Error getting auth token:", error);
          reject(new Error("Authentication failed. Please log in again."));
        }
      } else {
        reject(new Error("Not authenticated. Please log in."));
      }
    });
    
    setTimeout(() => {
      unsubscribe();
      reject(new Error("Authentication timeout. Please refresh and try again."));
    }, 5000);
  });
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    let authHeaders = await getAuthHeaders(false);
    const headers: Record<string, string> = {
      ...authHeaders,
    };
    
    if (data) {
      headers["Content-Type"] = "application/json";
    }

    let res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (res.status === 401) {
      authHeaders = await getAuthHeaders(true);
      headers["Authorization"] = authHeaders["Authorization"];
      
      res = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });
      
      if (res.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    if (error.message?.includes("Not authenticated") || error.message?.includes("Authentication")) {
      throw error;
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log("[QueryClient] Fetching:", queryKey);
    
    try {
      const authHeaders = await getAuthHeaders();
      console.log("[QueryClient] Got auth headers");
      
      const url = queryKey[0] as string;
      console.log("[QueryClient] Fetching URL:", url);
      
      const res = await fetch(url, {
        headers: authHeaders,
        credentials: "include",
      });

      console.log("[QueryClient] Response status:", res.status);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log("[QueryClient] Unauthorized, returning null");
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      console.log("[QueryClient] Success, got data:", data);
      return data;
    } catch (error) {
      console.error("[QueryClient] Error:", error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
