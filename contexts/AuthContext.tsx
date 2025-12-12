"use client";
import { User } from "@/types";
import { useRouter } from "next/navigation";
import { createContext, use, useContext, useEffect, useState } from "react";
// import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setloading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Session check error:", error);
      setUser(null);
    } finally {
      setloading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        router.push("/dashboard");
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  }

  async function register(formData: any) {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        router.push("/dashboard");

        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: "Terjadi Keasalahan. Silahkan coba lagi",
      };
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      setUser(null);
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  async function refreshUser() {
    await checkSession();
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
}
