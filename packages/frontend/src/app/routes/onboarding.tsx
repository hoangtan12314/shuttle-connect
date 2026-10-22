// app/routes: '/onboarding' -> one-time first-login profile step (name + skill level). Full-screen,
// like /callback. The onboarding gate itself lives in __root.tsx.
import { createFileRoute } from '@tanstack/react-router';
import { OnboardingPage } from '@/pages/onboarding';

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
  staticData: { bare: true, authFlow: true },
});
