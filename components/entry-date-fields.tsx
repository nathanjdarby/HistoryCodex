"use client";

import {
  daysInMonth,
  MONTH_OPTIONS,
  type EntryDateFormValue,
} from "@/lib/entry-dates";

type EntryDateFieldsProps = {
  value: EntryDateFormValue;
  onChange: (value: EntryDateFormValue) => void;
  allowRange?: boolean;
};

const PRECISION_OPTIONS: { value: EntryDateFormValue["precision"]; label: string }[] = [
  { value: "year", label: "Year" },
  { value: "month", label: "Month & year" },
  { value: "day", label: "Day, month & year" },
];

function dayOptions(year: string, month: string) {
  const y = Number(year);
  const m = Number(month);
  const max = Number.isInteger(y) && Number.isInteger(m) ? daysInMonth(y, m) : 31;
  return Array.from({ length: max }, (_, i) => String(i + 1));
}

function DateInputs({
  prefix,
  year,
  month,
  day,
  precision,
  onYearChange,
  onMonthChange,
  onDayChange,
}: {
  prefix: string;
  year: string;
  month: string;
  day: string;
  precision: EntryDateFormValue["precision"];
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onDayChange: (value: string) => void;
}) {
  const dayChoices = dayOptions(year, month);

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <label className="flex flex-col gap-1 text-sm">
        {prefix} year
        <input
          required
          type="number"
          value={year}
          onChange={(e) => onYearChange(e.target.value)}
          placeholder="1066 or -44 for BCE"
          className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
        />
      </label>
      {(precision === "month" || precision === "day") && (
        <label className="flex flex-col gap-1 text-sm">
          {prefix} month
          <select
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
          >
            {MONTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {precision === "day" && (
        <label className="flex flex-col gap-1 text-sm">
          {prefix} day
          <select
            value={dayChoices.includes(day) ? day : dayChoices[0]}
            onChange={(e) => onDayChange(e.target.value)}
            className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
          >
            {dayChoices.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

export function EntryDateFields({ value, onChange, allowRange = true }: EntryDateFieldsProps) {
  function setPrecision(precision: EntryDateFormValue["precision"]) {
    onChange({ ...value, precision });
  }

  return (
    <div className="col-span-full space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-neutral-200">Date</span>
        <div className="flex rounded-md border border-neutral-700 bg-neutral-900 p-0.5 text-xs">
          {PRECISION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPrecision(option.value)}
              className={`rounded px-2 py-1 ${
                value.precision === option.value
                  ? "bg-amber-700 text-amber-50"
                  : "text-neutral-400 hover:text-neutral-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <DateInputs
        prefix="Start"
        year={value.year}
        month={value.month}
        day={value.day}
        precision={value.precision}
        onYearChange={(year) => onChange({ ...value, year })}
        onMonthChange={(month) => onChange({ ...value, month })}
        onDayChange={(day) => onChange({ ...value, day })}
      />

      {allowRange && (
        <>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={value.hasEnd}
              onChange={(e) => onChange({ ...value, hasEnd: e.target.checked })}
              className="rounded border-neutral-600"
            />
            End date (optional range, e.g. lifespan)
          </label>

          {value.hasEnd && (
            <DateInputs
              prefix="End"
              year={value.yearEnd}
              month={value.monthEnd}
              day={value.dayEnd}
              precision={value.precision}
              onYearChange={(yearEnd) => onChange({ ...value, yearEnd })}
              onMonthChange={(monthEnd) => onChange({ ...value, monthEnd })}
              onDayChange={(dayEnd) => onChange({ ...value, dayEnd })}
            />
          )}
        </>
      )}

      <p className="text-xs text-neutral-500">
        Use negative years for BCE (e.g. -44 for 44 BCE). Pick the level of detail you know — year
        only, month and year, or an exact day.
      </p>
    </div>
  );
}
