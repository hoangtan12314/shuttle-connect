// features/update-profile/ui: ProfileForm -- React Hook Form + zodResolver, pre-filled from the
// caller's own profile (unlike features/complete-onboarding's OnboardingForm, which always starts
// empty). Schema rebuilt per language and memoized, same pattern as onboarding.
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { UserItemResponse } from '@shuttle-connect/types';
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
import { useUpdateProfile } from '../api/use-update-profile';
import {
  makeUpdateProfileSchema,
  type UpdateProfileFormValues,
} from '../model/schema';

export function ProfileForm({ me }: { me: UserItemResponse }) {
  const t = useT();
  const { mutate, isPending } = useUpdateProfile();
  const schema = useMemo(() => makeUpdateProfileSchema(t), [t]);

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: me.fullName, skillLevel: me.skillLevel },
  });

  const onSubmit = (values: UpdateProfileFormValues) => {
    mutate(values, {
      onSuccess: () => {
        toast.success(t.profileSavedT);
        form.reset(values);
      },
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
              <FormControl>
                <Input {...field} autoComplete="name" className="h-12" />
              </FormControl>
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

        <Button
          type="submit"
          size="lg"
          className="h-12 self-start"
          disabled={isPending || !form.formState.isDirty}
        >
          {t.saveChangesBtn}
        </Button>
      </form>
    </Form>
  );
}
