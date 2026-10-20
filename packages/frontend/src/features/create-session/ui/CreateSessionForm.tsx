import { useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { Area, City, ShuttleType, SkillLevel } from '@shuttle-connect/types';
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
import { useCourts, CourtOption } from '@/entities/court';
import { useCreateSession } from '../api/use-create-session';
import {
  createSessionSchema,
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
  skillLevelNames,
  shuttleTypeNames,
} from '@/shared/i18n';
import { areasForCity } from '@/shared/lib';

// Local to this form, not a new shared primitive -- Zod v4 splits a `z.coerce.number()` field's
// input/output types, which zodResolver's generic doesn't reconcile with react-hook-form's
// `Control<T>`. Keeping the schema's number fields as plain `z.number()` (input === output) and
// doing the string->number conversion here, in the one place a `<input type="number">`'s raw DOM
// value needs it, sidesteps that entirely.
function NumberField({
  control,
  name,
  label,
  min,
  step,
  hint,
}: {
  control: Control<CreateSessionFormValues>;
  name: 'slotsTotal' | 'priceMale' | 'priceFemale';
  label: string;
  min: number;
  step?: number;
  hint?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={min}
              step={step}
              name={field.name}
              value={field.value}
              onBlur={field.onBlur}
              ref={field.ref}
              onChange={(e) => field.onChange(e.target.valueAsNumber)}
            />
          </FormControl>
          {hint && <p className="text-muted-foreground text-sm">{hint}</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function CreateSessionForm() {
  const t = useT();
  const language = useLanguageStore((state) => state.language);
  const navigate = useNavigate();
  const { mutate, isPending } = useCreateSession();

  const defaultStart = nextFullHour();
  const form = useForm<CreateSessionFormValues>({
    resolver: zodResolver(createSessionSchema),
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

  const onSubmit = (values: CreateSessionFormValues) => {
    mutate(
      {
        courtId: values.courtId,
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
        slotsRemaining: values.slotsTotal,
        slotsTotal: values.slotsTotal,
        priceMale: values.priceMale,
        priceFemale: values.priceFemale,
        shuttleType: values.shuttleType,
        minSkillLevel: values.minSkillLevel,
        description: values.description || undefined,
      },
      {
        onSuccess: (session) => {
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
        <section className="flex flex-col gap-4">
          <h2 className="font-semibold">{t.sec1}</h2>

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
                    <SelectTrigger className="w-full">
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
                    <SelectTrigger className="w-full">
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
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-semibold">{t.sec2}</h2>

          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.start}</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
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
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-semibold">{t.sec3}</h2>

          <NumberField
            control={form.control}
            name="slotsTotal"
            label={t.totL}
            min={1}
          />

          <FormField
            control={form.control}
            name="minSkillLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.minL}</FormLabel>
                <Select
                  value={String(field.value)}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(SkillLevel)
                      .filter((v) => typeof v === 'number')
                      .map((level) => (
                        <SelectItem key={level} value={String(level)}>
                          {skillLevelNames[level as SkillLevel][language]}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-semibold">{t.sec4}</h2>

          <NumberField
            control={form.control}
            name="priceMale"
            label={t.priceM}
            min={0}
            step={1000}
          />

          <NumberField
            control={form.control}
            name="priceFemale"
            label={t.priceF}
            min={0}
            step={1000}
            hint={t.priceHint}
          />

          <FormField
            control={form.control}
            name="shuttleType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.shuttleL}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
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
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-semibold">{t.sec5}</h2>

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
        </section>

        <Button type="submit" disabled={isPending} size="lg">
          {isPending ? '...' : t.createSession}
        </Button>
      </form>
    </Form>
  );
}
