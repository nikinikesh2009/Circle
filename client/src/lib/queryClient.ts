import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "./firebase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      
      if (user) {
        try {
          const token = await user.getIdToken(true);
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
    const authHeaders = await getAuthHeaders();
    const headers: Record<string, string> = {
      ...authHeaders,
    };
    
    if (data) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (res.status === 401) {
      throw new Error("Session expired. Please log in again.");
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
    const authHeaders = await getAuthHeaders();
    
    const res = await fetch(queryKey.join("/") as string, {
      headers: authHeaders,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
