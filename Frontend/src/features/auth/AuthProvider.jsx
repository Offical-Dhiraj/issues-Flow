
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "./auth.api";

const AuthContext = createContext(null);
const AUTH_QUERY_KEY = ["auth", "me"];

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  const {
    data: user = null,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 60_000,
  });

  const login = useCallback(
    async (credentials) => {
      const loggedInUser = await loginUser(credentials);

      queryClient.setQueryData(AUTH_QUERY_KEY, loggedInUser);
      return loggedInUser;
    },
    [queryClient]
  );

  const register = useCallback(
    async (userData) => {
      const registeredUser = await registerUser(userData);

      queryClient.setQueryData(AUTH_QUERY_KEY, registeredUser);
      return registeredUser;
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== "auth",
      });
    }
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      isLoading: isPending,
      isAuthenticated: Boolean(user),
      isError,
      error,
      login,
      register,
      logout,
      refreshUser: refetch,
    }),
    [
      user,
      isPending,
      isError,
      error,
      login,
      register,
      logout,
      refetch,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
