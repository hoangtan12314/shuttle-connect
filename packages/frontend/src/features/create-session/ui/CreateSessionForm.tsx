import { useMemo, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import {
  Area,
  City,
  MAX_SLOTS_PER_SESSION,
  ShuttleType,
  SkillLevel,
  type SessionItemResponse,
} from '@shuttle-connect/types';
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
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Button } from '@/shared/ui/button';
import { FormSection } from '@/shared/ui/form-section';
import { PriceInput } from '@/shared/ui/price-input';
import { Stepper } from '@/shared/ui/stepper';
import { StickyBar } from '@/shared/ui/sticky-bar';
import { useCourts, CourtOption } from '@/entities/court';
import { SkillLevelPicker } from '@/entities/user';
import { useCreateSession } from '../api/use-create-session';
import {
  makeCreateSessionSchema,
  type CreateSessionFormValues,
} from '../model/schema';
import {
  SUGGESTED_SESSION_HOURS,
  addHoursToDateTimeLocal,
  nextFullHour,
  toDateTimeLocalValue,
} from '../lib/session-times';
import {
  useT,
  useLanguageStore,
  areaNames,
  shuttleTypeNames,
} from '@/shared/i18n';
import { areasForCity, formatDayHeader, formatTimeRange } from '@/shared/lib';
import { ArrowRight, Users } from 'lucide-react';

export function CreateSessionForm({
  coverField,
  onCreated,
}: {
  /** Extra field rendered above the submit button (the page passes the cover-photo picker --
   *  a feature can't import another feature, so the page composes them). */
  coverField?: ReactNode;
  /** Runs after the session exists and before navigating to it (the page uploads the cover
   *  here). A failure doesn't block navigation: the session was created either way, the error
   *  already toasted globally, and the cover can be retried from the edit page. */
  onCreated?: (session: SessionItemResponse) => Promise<unknown>;
} = {}) {
  const t = useT();
  const language = useLanguageStore((state) => state.language);
  const navigate = useNavigate();
  const { mutate, isPending } = useCreateSession();
  const [isFinishing, setIsFinishing] = useState(false);

  const schema = useMemo(() => makeCreateSessionSchema(t), [t]);

  const defaultStart = nextFullHour();
  const form = useForm<CreateSessionFormValues>({
    resolver: zodResolver(schema),
    // useForm reads defaultValues only on the first render, so recomputing defaultStart on later
    // renders is harmless.
    defaultValues: {
      city: City.HO_CHI_MINH,
      area: Area.HCM_DISTRICT_10,
      courtId: '',
      startTime: toDateTimeLocalValue(defaultStart),
      endTime: addHoursToDateTimeLocal(
        toDateTimeLocalValue(defaultStart),
        SUGGESTED_SESSION_HOURS,
      ),
      slotsTotal: 8,
      slotsFilled: 1,
      minSkillLevel: SkillLevel.BEGINNER,
      priceMale: 0,
      priceFemale: 0,
      shuttleType: ShuttleType.YONEX_AS30,
      description: '',
    },
  });

  const city = form.watch('city');
  const area = form.watch('area');
  const { data: courts, isLoading: isCourtsLoading } = useCourts(city, area);

  // Summary line in the sticky bar. A half-typed datetime-local is '' (or Invalid Date), and
  // Intl's format() throws a RangeError on an invalid Date, so only format once both parse.
  const startTime = form.watch('startTime');
  const endTime = form.watch('endTime');
  const slotsTotal = form.watch('slotsTotal');
  const slotsFilled = form.watch('slotsFilled');
  const openSlots = slotsTotal - slotsFilled;
  const timesValid =
    !Number.isNaN(new Date(startTime).getTime()) &&
    !Number.isNaN(new Date(endTime).getTime());
  const summary = timesValid
    ? `${formatDayHeader(new Date(startTime), language)} · ${formatTimeRange(startTime, endTime, language)} · ${openSlots} ${t.openShort}`
    : '';

  const onSubmit = (values: CreateSessionFormValues) => {
    mutate(
      {
        courtId: values.courtId,
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
        slotsRemaining: values.slotsTotal - values.slotsFilled,
        slotsTotal: values.slotsTotal,
        priceMale: values.priceMale,
        priceFemale: values.priceFemale,
        shuttleType: values.shuttleType,
        minSkillLevel: values.minSkillLevel,
        description: values.description || undefined,
      },
      {
        onSuccess: async (session) => {
          if (onCreated) {
            setIsFinishing(true);
            try {
              await onCreated(session);
            } catch {
              // Already toasted by the global MutationCache handler -- see onCreated's doc.
            }
          }
          navigate({
            to: '/sessions/$sessionId',
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
      >
        <FormSection index={1} title={t.sec1}>
          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.areaLabel}</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue('courtId', '');
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {areasForCity(city).map((a) => (
                      <SelectItem key={a} value={a}>
                        {areaNames[a][language]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courtId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.courtL}</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isCourtsLoading || !courts?.length}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue
                        placeholder={isCourtsLoading ? '...' : undefined}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courts?.map((court) => (
                      <CourtOption key={court.id} court={court} />
                    ))}
                  </SelectContent>
                </Select>
                {!isCourtsLoading && courts?.length === 0 && (
                  <p className="text-muted-foreground text-sm">{t.noCourts}</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection index={2} title={t.sec2}>
          {/* One column on phones: a datetime-local needs ~190px to show date and time, so two
              side by side at ~400px would clip. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.start}</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      className="h-12 text-base font-extrabold"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // Re-suggest the end time from the new start; the user can still edit it.
                        const suggestedEnd = addHoursToDateTimeLocal(
                          e.target.value,
                          SUGGESTED_SESSION_HOURS,
                        );
                        if (suggestedEnd) {
                          form.setValue('endTime', suggestedEnd, {
                            shouldValidate: form.formState.isSubmitted,
                          });
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.end}</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      className="h-12 text-base font-extrabold"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <FormSection index={3} title={t.sec3}>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="slotsTotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.totL}</FormLabel>
                  <Stepper
                    value={field.value}
                    min={1}
                    max={MAX_SLOTS_PER_SESSION}
                    decrementLabel={`${t.totL} −`}
                    incrementLabel={`${t.totL} +`}
                    onChange={(next) => {
                      field.onChange(next);
                      // Keep at least one slot open: pull the filled count down with the total.
                      if (form.getValues('slotsFilled') > next - 1) {
                        form.setValue('slotsFilled', Math.max(0, next - 1));
                      }
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slotsFilled"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.filledL}</FormLabel>
                  <Stepper
                    value={field.value}
                    min={0}
                    max={slotsTotal - 1}
                    decrementLabel={`${t.filledL} −`}
                    incrementLabel={`${t.filledL} +`}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <p className="bg-card flex items-center gap-2 rounded-xl border px-3.5 py-3 text-sm font-extrabold">
            <Users className="text-accent size-5" />
            {openSlots} {t.openSlotsForPlayers}
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

        <FormSection index={4} title={t.sec4}>
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

        <FormSection index={5} title={t.sec5}>
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

        {coverField}

        <StickyBar>
          {summary && <span className="text-sm font-extrabold">{summary}</span>}
          <Button
            type="submit"
            size="lg"
            disabled={isPending || isFinishing}
            className="min-h-12 justify-between"
          >
            {isFinishing ? t.coverUploading : isPending ? '...' : t.postSession}
            <ArrowRight />
          </Button>
        </StickyBar>
      </form>
    </Form>
  );
}
