// shared/lib: global "please sign in" modal state. Lives in shared, not features/auth, because
// shared/api/client's query-client needs to trigger it from a plain function (QueryCache/
// MutationCache's onError, not a component), and shared can never import from features -- that
// would be a layer violation the other way round. The actual modal UI (which does need
// features/auth's signIn) is composed in app/providers, the same place AppShell composes
// features/auth + entities/user.
import { create } from 'zustand';

interface AuthPromptState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  // Set the instant an intentional sign-out starts (features/auth's signOut), before the
  // isAuthenticated flip that would otherwise trip the root layout's requiresAuth gate. Without
  // this, logging out from a signed-in-only page (e.g. /notifications) briefly re-renders with
  // isAuthenticated: false *before* the actual redirect to Cognito's logout page takes over --
  // long enough to flash the "please sign in" modal open and closed for no reason, since the
  // user isn't trying to use a locked feature, they're deliberately leaving.
  isSigningOut: boolean;
  startSigningOut: () => void;
  stopSigningOut: () => void;
}

export const useAuthPromptStore = create<AuthPromptState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  isSigningOut: false,
  startSigningOut: () => set({ isSigningOut: true }),
  stopSigningOut: () => set({ isSigningOut: false }),
}));
