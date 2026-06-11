import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { unwrap } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const currentUser = unwrap(await api.get("/users/current-user"));
      setUser(currentUser);
      return currentUser;
    } catch {
      localStorage.removeItem("accessToken");
      setUser(null);
      return null;
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (credentials) => {
    const data = unwrap(await api.post("/users/login", credentials));
    localStorage.setItem("accessToken", data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const signup = async (formData) => unwrap(await api.post("/users/register", formData));

  const logout = async () => {
    try {
      await api.post("/users/logout");
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({ user, authLoading, login, signup, logout, refreshUser: fetchMe }),
    [user, authLoading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
