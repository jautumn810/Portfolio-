import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, AuthResponse } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (response: AuthResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("trucklink_token");
    const storedUser = localStorage.getItem("trucklink_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setAuthTokenGetter(() => storedToken);
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
        logout();
      }
    }
  }, []);

  const login = (response: AuthResponse) => {
    localStorage.setItem("trucklink_token", response.token);
    localStorage.setItem("trucklink_user", JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user);
    setAuthTokenGetter(() => response.token);
  };

  const logout = () => {
    localStorage.removeItem("trucklink_token");
    localStorage.removeItem("trucklink_user");
    setToken(null);
    setUser(null);
    setAuthTokenGetter(() => null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
