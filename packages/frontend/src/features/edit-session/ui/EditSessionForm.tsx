// features/edit-session/ui: the host's edit form. Court and time are shown but locked (request
// items copy them, so changing them would need a sync -- see UpdateSessionInput); everything else
// that lives only on the session's own item is editable. Cover photo is passed in as `coverField`
// by the page (a feature can't import another feature), and uploads on its own, immediately.
import { useMemo, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { ArrowRight, Lock, MapPin, Users } from 'lucide-react';
import {
  MAX_SLOTS_PER_SESSION,
  ShuttleType,
  type SessionItemResponse,
  type UpdateSessionInput,
} from '@shuttle-connect/types';
import { SkillLevelPicker } from '@/entities/user';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { FormSection } from '@/shared/ui/form-section';
import { PriceInput } from '@/shared/ui/price-input';
import { Stepper } from '@/shared/ui/stepper';
import { StickyBar } from '@/shared/ui/sticky-bar';
import { Textarea } from '@/shared/ui/textarea';
import {
  areaNames,
  shuttleTypeNames,
  useLanguageStore,
  useT,
} from '@/shared/i18n';
import { formatDayHeader, formatTimeRange } from '@/shared/lib';
import { useUpdateSession } from '../api/use-update-session';
import {
  makeEditSessionSchema,
  type EditSessionFormValues,
} from '../model/schema';

// Only what actually changed goes over the wire, so an untouched field can't overwrite a value
// someone else (a concurrent edit) just set.
function changesFrom(
  values: EditSessionFormValues,
  session: SessionItemResponse,
): UpdateSessionInput {
  const changes: UpdateSessionInput = {};
  if (values.slotsTotal !== session.slotsTotal)
    changes.slotsTotal = values.slotsTotal;
  if (values.priceMale !== session.priceMale)
    changes.priceMale = values.priceMale;
  if (values.priceFemale !== session.priceFemale)
    changes.priceFemale = values.priceFemale;
  if (values.shuttleType !== session.shuttleType)
    changes.shuttleType = values.shuttleType;
  if (values.minSkillLevel !== session.minSkillLevel)
    changes.minSkillLevel = values.minSkillLevel;
  if (values.description !== session.description)
    changes.description = values.description;
  return changes;
}

export function EditSessionForm({
  session,
  coverField,
}: {
  session: SessionItemResponse;
  coverField?: ReactNode;
}) {
  const t = useT();
  const language = useLanguageStore((state) => state.language);
  const navigate = useNavigate();
  const { mutate, isPending } = useUpdateSession();

  const filledSlots = session.slotsTotal - session.slotsRemaining;
  const schema = useMemo(
    () => makeEditSessionSchema(filledSlots),
    [filledSlots],
  );

  const form = useForm<EditSessionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slotsTotal: session.slotsTotal,
      minSkillLevel: session.minSkillLevel,
      priceMale: session.priceMale,
      priceFemale: session.priceFemale,
      shuttleType: session.shuttleType as ShuttleType,
      description: session.description,
    },
  });

  const slotsTotal = useWatch({ control: form.control, name: 'slotsTotal' });
  const openSlots = slotsTotal - filledSlots;

  const onSubmit = (values: EditSessionFormValues) => {
    mutate(
      { sessionId: session.id, changes: changesFrom(values, session) },
      {
        onSuccess: () => {
          toast.success(t.changesSaved);
          navigate({
            to: '/sessions/$sessionId/manage',
            params: { sessionId: session.id },
          });
        },
      },
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-8"
        noValidate
      >
        <div className="bg-card flex flex-col gap-1.5 rounded-xl border p-4">
          <span className="text-primary-700 text-xs font-extrabold tracking-wider uppercase">
            {formatDayHeader(new Date(session.startTime), language)}
          </span>
          <span className="text-3xl font-extrabold tracking-tight">
            {formatTimeRange(session.startTime, session.endTime, language)}
          </span>
          <span className="font-extrabold">{session.court.name}</span>
          <span className="flex items-center gap-1.5 text-sm">
            <MapPin className="size-4 flex-none" />
            {areaNames[session.court.district][language]} · {session.court.city}
          </span>
          <span className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
            <Lock className="size-3.5 flex-none" />
            {t.lockedFieldsNote}
          </span>
        </div>

        {coverField}

        <FormSection index={1} title={t.sec3}>
          <FormField
            control={form.control}
            name="slotsTotal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.totL}</FormLabel>
                <Stepper
                  value={field.value}
                  min={Math.max(1, filledSlots)}
                  max={MAX_SLOTS_PER_SESSION}
                  decrementLabel={`${t.totL} −`}
                  incrementLabel={`${t.totL} +`}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <p className="bg-card flex items-center gap-2 rounded-xl border px-3.5 py-3 text-sm font-extrabold">
            <Users className="text-accent size-5" />
            {filledSlots} {t.filledShort} · {openSlots} {t.openSlotsForPlayers}
          </p>

          <FormField
            control={form.control}
            name="minSkillLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.minL}</FormLabel>
                <FormControl>
                  <SkillLevelPicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <p className="text-muted-foreground text-sm">
                  {t.levelWarnHint}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection index={2} title={t.sec4}>
          <div className="grid grid-cols-2 gap-4">
            {(['priceMale', 'priceFemale'] as const).map((name) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {name === 'priceMale' ? t.priceM : t.priceF}
                    </FormLabel>
                    <FormControl>
                      <PriceInput
                        name={field.name}
                        value={Number.isNaN(field.value) ? '' : field.value}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <p className="text-muted-foreground -mt-2 text-sm">{t.priceHint}</p>

          <FormField
            control={form.control}
            name="shuttleType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.shuttleL}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(ShuttleType).map((shuttle) => (
                      <SelectItem key={shuttle} value={shuttle}>
                        {shuttleTypeNames[shuttle]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection index={3} title={t.sec5}>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea placeholder={t.descPh} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <StickyBar>
          <Button
            type="submit"
            size="lg"
            disabled={isPending || !form.formState.isDirty}
            className="min-h-12 justify-between"
          >
            {isPending ? '...' : t.saveChangesBtn}
            <ArrowRight />
          </Button>
        </StickyBar>
      </form>
    </Form>
  );
}
