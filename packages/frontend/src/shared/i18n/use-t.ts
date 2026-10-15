// shared/i18n: useT() returns the message dictionary for the active language. Call once per
// component (`const t = useT()`) and read `t.someKey` -- not `useT('someKey')` per call -- so a
// typo in a key is a type error against Messages, not a silent `undefined` at render time.
import { vi } from './messages/vi';
import { en } from './messages/en';
import { useLanguageStore } from './language-store';

// { [key]: string }, not `typeof vi` directly -- `typeof vi` would capture vi's exact string
// LITERALS as the type, which `en`'s different literal values could never satisfy.
export type Messages = { [K in keyof typeof vi]: string };

const dictionaries: Record<'vi' | 'en', Messages> = { vi, en };

export function useT(): Messages {
  const language = useLanguageStore((state) => state.language);
  return dictionaries[language];
}
