import { useAuthContext } from '../contexts/AuthContext';

export function useAuth() {
  const { user, session, isLoading, signIn, signUp, signOut } = useAuthContext();

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };
}
