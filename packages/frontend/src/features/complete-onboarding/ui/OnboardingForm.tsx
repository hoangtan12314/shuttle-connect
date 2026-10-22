// features/complete-onboarding/ui: name + skill level, the one-time first-login form. React Hook
// Form + zodResolver; the schema is rebuilt per language (see model/schema.ts) and memoized so the
// resolver isn't recreated every render.
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, User } from 'lucide-react';
import { SkillLevelPicker } from '@/entities/user';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { useT } from '@/shared/i18n';
import { useCompleteOnboarding } from '../api/use-complete-onboarding';
import {
  makeOnboardingSchema,
  type OnboardingFormValues,
} from '../model/schema';

export function OnboardingForm() {
  const t = useT();
  const navigate = useNavigate();
  const { mutate, isPending } = useCompleteOnboarding();
  const schema = useMemo(() => makeOnboardingSchema(t), [t]);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(schema),
    // Name starts EMPTY (not pre-filled with the email-prefix fallback) and no level is
    // pre-selected: both are deliberate choices the user makes here.
    defaultValues: { fullName: '', skillLevel: undefined },
  });

  const onSubmit = (values: OnboardingFormValues) => {
    mutate(values, {
      // replace: /onboarding is a one-time stopover; "back" shouldn't return to it.
      onSuccess: () => navigate({ to: '/', replace: true }),
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
        noValidate
      >
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.nameL}</FormLabel>
              <div className="relative">
                <User className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t.namePh}
                    autoComplete="name"
                    className="h-12 rounded-xl pl-9"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="skillLevel"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t.levelPick}</FormLabel>
              <FormDescription>{t.levelHint}</FormDescription>
              <FormControl>
                <SkillLevelPicker
                  value={field.value}
                  onChange={field.onChange}
                  aria-invalid={fieldState.invalid}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" className="h-12" disabled={isPending}>
          {t.continueBtn}
          <ArrowRight />
        </Button>
      </form>
    </Form>
  );
}
