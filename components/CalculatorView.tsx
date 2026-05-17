import React from 'react';
import { CalculationData, CalculatedCosts, Currency, Currencies, FilamentProfile } from '../types';
import { CURRENCIES, FILAMENT_DENSITIES } from '../constants';

interface CalculatorViewProps {
  data: CalculationData;
  costs: CalculatedCosts;
  currency: Currency;
  currencies: Currencies;
  ratesLastUpdated: string | null;
  ratesStale: boolean;
  ratesLoading: boolean;
  onDataChange: <K extends keyof CalculationData>(key: K, value: CalculationData[K]) => void;
  onFilamentProfileChange: (id: string, key: keyof FilamentProfile, value: string | number) => void;
  onAddFilamentProfile: () => void;
  onRemoveFilamentProfile: (id: string) => void;
  onSave: () => void;
  onGeneratePdf: () => void;
  onViewHistory: () => void;
  onRefreshRates: () => void;
}

interface InputFieldProps {
  id: string;
  label: string;
  description?: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  className?: string;
  disabled?: boolean;
}

const sectionCardClass = 'rounded-[1.6rem] border-2 border-slate-300/95 bg-slate-100 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.08)] ring-1 ring-slate-400/20 sm:p-6';

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  description,
  type = 'text',
  value,
  onChange,
  min,
  max,
  step,
  className,
  disabled,
}) => (
  <div className={className}>
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
      {label}
    </label>
    {description && (
      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    )}
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={`mt-2 w-full rounded-2xl border px-4 py-3 shadow-sm outline-none transition ${
        disabled
          ? 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-400'
          : 'border-slate-300 bg-slate-200/80 text-slate-900 focus:border-sky-500 focus:bg-slate-50 focus:ring-4 focus:ring-sky-100'
      }`}
    />
  </div>
);

const SectionHeader: React.FC<{ eyebrow: string; title: string; description: string }> = ({ eyebrow, title, description }) => (
  <div className="mb-5">
    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">{eyebrow}</div>
    <h2 className="mt-2 font-['Space_Grotesk'] text-2xl font-bold text-slate-900">{title}</h2>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
  </div>
);

const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
};

const SummaryStat: React.FC<{ label: string; value: string; tone?: 'default' | 'accent' }> = ({ label, value, tone = 'default' }) => (
  <div className={`rounded-2xl border-2 px-4 py-4 ${tone === 'accent' ? 'border-emerald-300 bg-emerald-100/80' : 'border-slate-300 bg-slate-200/70'}`}>
    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</div>
    <div className={`mt-2 text-xl font-bold ${tone === 'accent' ? 'text-emerald-700' : 'text-slate-900'}`}>{value}</div>
  </div>
);

const OptionalCostSection: React.FC<{
  title: string;
  description: string;
  includeId: keyof CalculationData;
  isIncluded: boolean;
  hoursId?: keyof CalculationData;
  hoursValue?: number;
  minutesId?: keyof CalculationData;
  minutesValue?: number;
  rateId: keyof CalculationData;
  rateValue: number;
  onDataChange: <K extends keyof CalculationData>(key: K, value: CalculationData[K]) => void;
  currencySymbol: string;
  rateUnit: string;
  extraFields?: React.ReactNode;
}> = ({
  title,
  description,
  includeId,
  isIncluded,
  hoursId,
  hoursValue,
  minutesId,
  minutesValue,
  rateId,
  rateValue,
  onDataChange,
  currencySymbol,
  rateUnit,
  extraFields,
}) => {
  const hasTimeFields = hoursId && minutesId;

  return (
    <div className="rounded-[1.35rem] border-2 border-slate-300 bg-slate-200/65 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="pr-4">
          <label htmlFor={String(includeId)} className="flex cursor-pointer items-center gap-3">
            <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${isIncluded ? 'bg-slate-900' : 'bg-slate-300'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${isIncluded ? 'translate-x-5' : 'translate-x-1'}`} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-900">{title}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
            </span>
          </label>
          <input
            id={String(includeId)}
            type="checkbox"
            checked={isIncluded}
            onChange={(e) => onDataChange(includeId, e.target.checked)}
            className="sr-only"
          />
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isIncluded ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
          {isIncluded ? 'Included' : 'Optional'}
        </span>
      </div>

      {isIncluded && (
        <div className="mt-4 space-y-4">
          {hasTimeFields && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <InputField
                id={String(hoursId)}
                label="Hours"
                type="number"
                value={hoursValue || 0}
                min={0}
                onChange={(e) => onDataChange(hoursId!, e.target.valueAsNumber || 0)}
              />
              <InputField
                id={String(minutesId)}
                label="Minutes"
                type="number"
                value={minutesValue || 0}
                min={0}
                max={59}
                onChange={(e) => onDataChange(minutesId!, e.target.valueAsNumber || 0)}
              />
              <InputField
                id={String(rateId)}
                label={`Rate (${currencySymbol})`}
                description={rateUnit}
                type="number"
                value={rateValue}
                min={0}
                step="0.01"
                onChange={(e) => onDataChange(rateId, e.target.valueAsNumber || 0)}
              />
            </div>
          )}
          {!hasTimeFields && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <InputField
                id={String(rateId)}
                label={`Rate (${currencySymbol})`}
                description={rateUnit}
                type="number"
                value={rateValue}
                min={0}
                step="0.01"
                onChange={(e) => onDataChange(rateId, e.target.valueAsNumber || 0)}
              />
              {extraFields}
            </div>
          )}
          {hasTimeFields && extraFields && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {extraFields}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CalculatorView: React.FC<CalculatorViewProps> = ({
  data,
  costs,
  currency,
  currencies,
  ratesLastUpdated,
  ratesStale,
  ratesLoading,
  onDataChange,
  onFilamentProfileChange,
  onAddFilamentProfile,
  onRemoveFilamentProfile,
  onSave,
  onGeneratePdf,
  onViewHistory,
  onRefreshRates,
}) => {
  const totalPrintSeconds = (data.printTimeHours * 3600) + (data.printTimeMinutes * 60) + data.printTimeSeconds;
  const totalPrintHours = (totalPrintSeconds / 3600).toFixed(2);
  const activeOptionalCosts = [data.includeElectricity, data.includeLabor, data.includePostProcessing].filter(Boolean).length;
  const extraSwitchTimeLabel = formatDuration(costs.extraSwitchTimeSeconds);
  const effectivePrintTimeLabel = formatDuration(costs.effectivePrintTimeSeconds);
  const prepTimeLabel = formatDuration(costs.prepTimeSeconds);
  const switchTimePerChangeLabel = formatDuration(Math.round(costs.calculatedSwitchTimePerChangeSeconds));

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,420px)] 2xl:grid-cols-[minmax(0,1.95fr)_minmax(380px,460px)]">
      <div className="space-y-6">
        <section className={sectionCardClass}>
          <SectionHeader
            eyebrow="Quick Guide"
            title="What each area does"
            description="A simple reference for first-time users so the screen stays approachable."
          />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
            <div className="rounded-2xl border-2 border-slate-300 bg-slate-200/70 px-4 py-3 text-sm leading-6 text-slate-600">
              <span className="font-semibold text-slate-900">Order details:</span> names and dates for saved records and receipts.
            </div>
            <div className="rounded-2xl border-2 border-slate-300 bg-slate-200/70 px-4 py-3 text-sm leading-6 text-slate-600">
              <span className="font-semibold text-slate-900">Time and material:</span> the direct production cost inputs.
            </div>
            <div className="rounded-2xl border-2 border-slate-300 bg-slate-200/70 px-4 py-3 text-sm leading-6 text-slate-600">
              <span className="font-semibold text-slate-900">Multi-color:</span> color-by-color spool pricing plus purge waste and switch-time overhead.
            </div>
            <div className="rounded-2xl border-2 border-slate-300 bg-slate-200/70 px-4 py-3 text-sm leading-6 text-slate-600">
              <span className="font-semibold text-slate-900">Service costs:</span> optional labor, electricity, and finishing charges.
            </div>
          </div>
        </section>

        <section className={`${sectionCardClass} overflow-hidden bg-[linear-gradient(135deg,_#efe2d0_0%,_#e8ecf1_48%,_#d9e7f3_100%)]`}>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,340px)] xl:items-end 2xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,380px)]">
            <div>
              <div className="inline-flex items-center rounded-full border-2 border-amber-300 bg-amber-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">
                Guided workflow
              </div>
              <h2 className="mt-4 font-['Space_Grotesk'] text-3xl font-bold text-slate-900">
                Build a quote with a cleaner flow.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Start with order details, enter time and material inputs from your slicer, then include any extra service costs before exporting or saving.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SummaryStat label="Print Time" value={`${totalPrintHours} hrs`} />
                <SummaryStat label="Multi-color Waste" value={`${costs.totalWasteG.toFixed(1)} g`} />
                <SummaryStat label="Quantity" value={`${data.quantity} units`} />
              </div>
            </div>

            <div className="rounded-[1.5rem] border-2 border-slate-300 bg-slate-100/90 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.1)]">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Currency</div>
              <select
                id="currency"
                value={data.currency}
                onChange={(e) => onDataChange('currency', e.target.value)}
                className="mt-2 w-full rounded-2xl border-2 border-slate-300 bg-slate-200/80 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-slate-50 focus:ring-4 focus:ring-sky-100"
              >
                {Object.keys(currencies).length > 0
                  ? Object.keys(currencies).map(key => (
                      <option key={key} value={key}>
                        {currencies[key].symbol} {currencies[key].name} ({key})
                      </option>
                    ))
                  : Object.keys(CURRENCIES).map(key => (
                      <option key={key} value={key}>
                        {CURRENCIES[key].symbol} {CURRENCIES[key].name} ({key})
                      </option>
                    ))
                }
              </select>
              {ratesLastUpdated && (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Rates updated: {new Date(ratesLastUpdated).toLocaleDateString()}
                  {ratesStale && (
                    <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      Stale
                    </span>
                  )}
                </p>
              )}
              <button
                type="button"
                onClick={onRefreshRates}
                disabled={ratesLoading}
                className="mt-2 inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 disabled:opacity-50"
              >
                {ratesLoading ? 'Refreshing...' : 'Refresh Rates'}
              </button>
              <button
                type="button"
                onClick={onViewHistory}
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open Saved History
              </button>
            </div>
          </div>
        </section>

        <section className={sectionCardClass}>
          <SectionHeader
            eyebrow="Step 1"
            title="Order Details"
            description="Capture the print identity first so every saved quote and exported PDF is easy to recognize later."
          />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <InputField
              id="print-name"
              label="Print Name"
              description="The project or part name used across history and receipts."
              value={data.printName}
              onChange={(e) => onDataChange('printName', e.target.value)}
            />
            <InputField
              id="customer-name"
              label="Customer Name"
              description="Optional, but useful for client tracking."
              value={data.customerName}
              onChange={(e) => onDataChange('customerName', e.target.value)}
            />
            <InputField
              id="purchase-date"
              label="Quote Date"
              description="Use this to timestamp the pricing decision."
              type="date"
              value={data.purchaseDate}
              onChange={(e) => onDataChange('purchaseDate', e.target.value)}
            />
            <InputField
              id="quantity"
              label="Quantity"
              description="Number of identical parts. Per-unit pricing shown in summary."
              type="number"
              value={data.quantity}
              min={1}
              onChange={(e) => onDataChange('quantity', e.target.valueAsNumber || 1)}
            />
          </div>
        </section>

        <section className={sectionCardClass}>
          <SectionHeader
            eyebrow="Step 2"
            title="Time and Material Inputs"
            description="Enter the baseline numbers from your slicer that directly drive cost."
          />
          <div className="grid gap-6 2xl:grid-cols-2">
            <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-4">
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-slate-900">Print Duration</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Total machine time used for electricity and overall schedule awareness.
              </p>
              <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
                <InputField
                  id="print-time-hours"
                  label="Hours"
                  type="number"
                  value={data.printTimeHours}
                  min={0}
                  onChange={(e) => onDataChange('printTimeHours', e.target.valueAsNumber || 0)}
                />
                <InputField
                  id="print-time-minutes"
                  label="Minutes"
                  type="number"
                  value={data.printTimeMinutes}
                  min={0}
                  max={59}
                  onChange={(e) => onDataChange('printTimeMinutes', e.target.valueAsNumber || 0)}
                />
                <InputField
                  id="print-time-seconds"
                  label="Seconds"
                  type="number"
                  value={data.printTimeSeconds}
                  min={0}
                  max={59}
                  onChange={(e) => onDataChange('printTimeSeconds', e.target.valueAsNumber || 0)}
                />
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-4">
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-slate-900">Material Setup</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                These fields define filament consumption and the base material rate for the quote.
              </p>
              {data.includeMultiColor && (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  Multi-color mode is enabled, so these single-spool material fields are ignored for pricing. Use the per-color filament entries in Step 3 instead.
                </div>
              )}
              <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
                <div>
                  <label htmlFor="material-type" className="block text-sm font-semibold text-slate-700">
                    Material Type
                  </label>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Determines density for weight/length conversion.
                  </p>
                  <select
                    id="material-type"
                    value={data.materialType}
                    onChange={(e) => onDataChange('materialType', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-200/80 px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:bg-slate-50 focus:ring-4 focus:ring-sky-100"
                  >
                    {Object.keys(FILAMENT_DENSITIES).map(type => (
                      <option key={type} value={type}>{type} ({FILAMENT_DENSITIES[type]} g/cm³)</option>
                    ))}
                  </select>
                </div>
                <InputField
                  id="filament-diameter"
                  label="Diameter (mm)"
                  description="Usually 1.75 mm or 2.85 mm."
                  type="number"
                  value={data.filamentDiameter}
                  min={0}
                  step="0.01"
                  onChange={(e) => onDataChange('filamentDiameter', e.target.valueAsNumber || 0)}
                />
                <InputField
                  id="filament-weight"
                  label="Weight (g)"
                  description={data.includeMultiColor ? 'Ignored while multi-color mode is enabled.' : 'Total material consumed. Auto-syncs with Length.'}
                  type="number"
                  value={data.filamentWeight}
                  min={0}
                  disabled={data.includeMultiColor}
                  onChange={(e) => onDataChange('filamentWeight', e.target.valueAsNumber || 0)}
                />
                <InputField
                  id="filament-length"
                  label="Length (m)"
                  description="Auto-synced with weight using material density."
                  type="number"
                  value={data.filamentLengthM}
                  min={0}
                  step="0.01"
                  disabled={data.includeMultiColor}
                  onChange={(e) => onDataChange('filamentLengthM', e.target.valueAsNumber || 0)}
                />
                <InputField
                  id="filament-price"
                  label="Filament Price"
                  description={data.includeMultiColor ? 'Ignored while multi-color mode is enabled.' : `${currency.symbol} per kg`}
                  type="number"
                  value={data.filamentPrice}
                  min={0}
                  step="0.01"
                  disabled={data.includeMultiColor}
                  onChange={(e) => onDataChange('filamentPrice', e.target.valueAsNumber || 0)}
                />
                <InputField
                  id="failure-rate"
                  label="Failure Risk %"
                  description="Buffer for failed prints and calibration waste."
                  type="number"
                  value={data.failureRate}
                  min={0}
                  max={100}
                  step="0.5"
                  onChange={(e) => onDataChange('failureRate', e.target.valueAsNumber || 0)}
                />
              </div>
            </div>
          </div>
        </section>

        <section className={sectionCardClass}>
          <SectionHeader
            eyebrow="Step 3"
            title="Multi-Color Printing"
            description="Switch this on when the part uses more than one filament color. Enter model, purge, and tower filament per color from your slicer output. Total weight is calculated automatically."
          />

          <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <label htmlFor="include-multi-color" className="flex cursor-pointer items-center gap-3">
                <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${data.includeMultiColor ? 'bg-slate-900' : 'bg-slate-300'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${data.includeMultiColor ? 'translate-x-5' : 'translate-x-1'}`} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Enable multi-color costing</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Use per-color pricing plus purge and switching overhead instead of a single spool rate.
                  </span>
                </span>
              </label>
              <input
                id="include-multi-color"
                type="checkbox"
                checked={data.includeMultiColor}
                onChange={(e) => onDataChange('includeMultiColor', e.target.checked)}
                className="sr-only"
              />
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${data.includeMultiColor ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                {data.includeMultiColor ? 'Multi-color mode on' : 'Single-color mode'}
              </span>
            </div>

            {data.includeMultiColor && (
              <div className="mt-5 space-y-5">
                <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-['Space_Grotesk'] text-lg font-bold text-slate-900">Filament by color</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Enter the same categories your slicer shows: model, purged, and tower filament for each color. Total weight is calculated automatically.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onAddFilamentProfile}
                      className="rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Add Color
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    {data.filamentProfiles.map((profile, index) => {
                      const profileTotalG = profile.modelWeightG + profile.purgeWasteG + profile.towerWasteG;
                      return (
                        <div key={profile.id} className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-slate-900">Color {index + 1}: {profile.colorName || 'Unnamed'}</div>
                            {data.filamentProfiles.length > 2 && (
                              <button
                                type="button"
                                onClick={() => onRemoveFilamentProfile(profile.id)}
                                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
                            <InputField
                              id={`profile-name-${profile.id}`}
                              label="Color Name"
                              description="Example: White, Black, Red Accent"
                              value={profile.colorName}
                              onChange={(e) => onFilamentProfileChange(profile.id, 'colorName', e.target.value)}
                            />
                            <InputField
                              id={`profile-weight-${profile.id}`}
                              label="Model Filament (g)"
                              description="Filament from this color that remains in the printed part."
                              type="number"
                              value={profile.modelWeightG}
                              min={0}
                              step="0.01"
                              onChange={(e) => onFilamentProfileChange(profile.id, 'modelWeightG', e.target.valueAsNumber || 0)}
                            />
                            <InputField
                              id={`profile-purge-${profile.id}`}
                              label="Purged Filament (g)"
                              description="Waste pushed out during color changes for this color."
                              type="number"
                              value={profile.purgeWasteG}
                              min={0}
                              step="0.01"
                              onChange={(e) => onFilamentProfileChange(profile.id, 'purgeWasteG', e.target.valueAsNumber || 0)}
                            />
                            <InputField
                              id={`profile-tower-${profile.id}`}
                              label="Tower Filament (g)"
                              description="Material consumed in the prime tower for this color."
                              type="number"
                              value={profile.towerWasteG}
                              min={0}
                              step="0.01"
                              onChange={(e) => onFilamentProfileChange(profile.id, 'towerWasteG', e.target.valueAsNumber || 0)}
                            />
                            <InputField
                              id={`profile-price-${profile.id}`}
                              label="Price per kg"
                              description={`${currency.symbol} per spool kilogram`}
                              type="number"
                              value={profile.pricePerKg}
                              min={0}
                              step="0.01"
                              onChange={(e) => onFilamentProfileChange(profile.id, 'pricePerKg', e.target.valueAsNumber || 0)}
                            />
                          </div>

                          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                            <div className="font-semibold">Total Weight (g): <span className="text-emerald-700">{profileTotalG.toFixed(2)}</span></div>
                            <div className="text-emerald-700">Model {profile.modelWeightG.toFixed(2)} + Purge {profile.purgeWasteG.toFixed(2)} + Tower {profile.towerWasteG.toFixed(2)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 2xl:grid-cols-2">
                  <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                    <h3 className="font-['Space_Grotesk'] text-lg font-bold text-slate-900">Filament changes</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Use the slicer's "Filament change times" count here. This drives the extra switching time calculation.
                    </p>
                    <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
                      <InputField
                        id="color-switch-count"
                        label="Filament Change Times"
                        description="Example from your Bambu result: 11"
                        type="number"
                        value={data.colorSwitchCount}
                        min={0}
                        onChange={(e) => onDataChange('colorSwitchCount', e.target.valueAsNumber || 0)}
                      />
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                    <h3 className="font-['Space_Grotesk'] text-lg font-bold text-slate-900">Time overhead</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Enter the slicer times you already have. The app will automatically calculate the repeating filament-change overhead.
                    </p>
                    <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
                      <InputField
                        id="prep-time-minutes"
                        label="Prep/Timelapse Minutes"
                        description="One-time overhead from the slicer result."
                        type="number"
                        value={data.prepTimeMinutes}
                        min={0}
                        onChange={(e) => onDataChange('prepTimeMinutes', e.target.valueAsNumber || 0)}
                      />
                      <InputField
                        id="prep-time-seconds"
                        label="Prep/Timelapse Seconds"
                        description="Example from your screenshot: 6m23s"
                        type="number"
                        value={data.prepTimeSeconds}
                        min={0}
                        max={59}
                        onChange={(e) => onDataChange('prepTimeSeconds', e.target.valueAsNumber || 0)}
                      />
                      <InputField
                        id="sliced-total-time-hours"
                        label="Total Time Hours"
                        description="Use the slicer's total time."
                        type="number"
                        value={data.slicedTotalTimeHours}
                        min={0}
                        onChange={(e) => onDataChange('slicedTotalTimeHours', e.target.valueAsNumber || 0)}
                      />
                      <InputField
                        id="sliced-total-time-minutes"
                        label="Total Time Minutes"
                        description="Example from your screenshot: 6h5m"
                        type="number"
                        value={data.slicedTotalTimeMinutes}
                        min={0}
                        max={59}
                        onChange={(e) => onDataChange('slicedTotalTimeMinutes', e.target.valueAsNumber || 0)}
                      />
                      <InputField
                        id="sliced-total-time-seconds"
                        label="Total Time Seconds"
                        description="Usually 0 unless the slicer shows seconds."
                        type="number"
                        value={data.slicedTotalTimeSeconds}
                        min={0}
                        max={59}
                        onChange={(e) => onDataChange('slicedTotalTimeSeconds', e.target.valueAsNumber || 0)}
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                      <div className="font-semibold">Calculated automatically</div>
                      <div className="mt-1">Per-change overhead: {switchTimePerChangeLabel}</div>
                      <div>Total filament-change overhead: {extraSwitchTimeLabel}</div>
                      {data.includeLabor && costs.prepTimeSeconds > 0 && (
                        <div className="text-emerald-700">
                          Prep time billed under Labor: {currency.symbol} {costs.prepLaborCost.toFixed(2)}
                        </div>
                      )}
                      <div className="text-emerald-700">
                        Formula: `Total time - Model printing time - Prepare/timelapse time`
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
                  <div className="font-semibold">Bambu Studio mapping</div>
                  <div className="mt-2">`Model` maps to each color's `Model Filament (g)`.</div>
                  <div>`Purged` maps to each color's `Purged Filament (g)`.</div>
                  <div>`Tower` maps to each color's `Tower Filament (g)`.</div>
                  <div>`Filament change times` maps to `Filament Change Times`.</div>
                  <div>`Prepare and timelapse time` maps to `Prep/Timelapse`.</div>
                  <div>`Total time` maps to `Total Time` and is used to derive change-overhead automatically.</div>
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
                  <SummaryStat label="Model Filament" value={`${data.filamentProfiles.reduce((sum, p) => sum + p.modelWeightG, 0).toFixed(1)} g`} />
                  <SummaryStat label="Purged Filament" value={`${costs.totalPurgeWasteG.toFixed(1)} g`} />
                  <SummaryStat label="Tower Filament" value={`${costs.totalTowerWasteG.toFixed(1)} g`} />
                  <SummaryStat label="Total Weight" value={`${(data.filamentProfiles.reduce((s, p) => s + p.modelWeightG + p.purgeWasteG + p.towerWasteG, 0)).toFixed(1)} g`} tone="accent" />
                  <SummaryStat label="Added Time" value={`${extraSwitchTimeLabel} + ${prepTimeLabel}`} />
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={sectionCardClass}>
          <SectionHeader
            eyebrow="Step 4"
            title="Service and Overhead Costs"
            description="Turn extra cost categories on only when they apply. Each one is labeled so it is clear what operational work it represents."
          />
          <div className="space-y-4">
            <OptionalCostSection
              title="Electricity"
              description="Add machine power cost based on print time and wattage."
              includeId="includeElectricity"
              isIncluded={data.includeElectricity}
              rateId="electricityCost"
              rateValue={data.electricityCost}
              onDataChange={onDataChange}
              currencySymbol={currency.symbol}
              rateUnit="Per kWh"
              extraFields={
                <InputField
                  id="printer-wattage"
                  label="Printer Wattage (W)"
                  description="Average power draw during printing."
                  type="number"
                  value={data.printerWattage}
                  min={0}
                  step="10"
                  onChange={(e) => onDataChange('printerWattage', e.target.valueAsNumber || 0)}
                />
              }
            />

            <OptionalCostSection
              title="Labor"
              description="Use this for setup, supervision, packing, or hand finishing that involves staff time."
              includeId="includeLabor"
              isIncluded={data.includeLabor}
              hoursId="laborTimeHours"
              hoursValue={data.laborTimeHours}
              minutesId="laborTimeMinutes"
              minutesValue={data.laborTimeMinutes}
              rateId="laborRate"
              rateValue={data.laborRate}
              onDataChange={onDataChange}
              currencySymbol={currency.symbol}
              rateUnit="Per labor hour"
            />

            <OptionalCostSection
              title="Post-Processing"
              description="Capture sanding, support removal, painting, curing, or other finishing work."
              includeId="includePostProcessing"
              isIncluded={data.includePostProcessing}
              hoursId="postProcessingHours"
              hoursValue={data.postProcessingHours}
              minutesId="postProcessingMinutes"
              minutesValue={data.postProcessingMinutes}
              rateId="postProcessingRate"
              rateValue={data.postProcessingRate}
              onDataChange={onDataChange}
              currencySymbol={currency.symbol}
              rateUnit="Per finishing hour"
            />

            <OptionalCostSection
              title="Machine Depreciation"
              description="Account for wear on hotends, belts, nozzles, and other consumable parts."
              includeId="includeDepreciation"
              isIncluded={data.includeDepreciation}
              rateId="depreciationRate"
              rateValue={data.depreciationRate}
              onDataChange={onDataChange}
              currencySymbol={currency.symbol}
              rateUnit="Per hour of print time"
            />
          </div>

          <div className="mt-5 rounded-[1.35rem] border border-amber-200 bg-amber-50 p-4">
            <InputField
              id="markup"
              label="Markup Percentage"
              description="Use markup to cover margin, risk, and business overhead on top of direct costs."
              type="number"
              value={data.markup}
              min={0}
              onChange={(e) => onDataChange('markup', e.target.valueAsNumber || 0)}
            />
          </div>

          <div className="mt-4 rounded-[1.35rem] border border-sky-200 bg-sky-50 p-4">
            <InputField
              id="tax-rate"
              label="Tax Rate %"
              description="Sales tax or VAT applied after markup."
              type="number"
              value={data.taxRate}
              min={0}
              max={100}
              step="0.5"
              onChange={(e) => onDataChange('taxRate', e.target.valueAsNumber || 0)}
            />
          </div>
        </section>
      </div>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        <div className="space-y-6">
          <section className="rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Live pricing</div>
            <h2 className="mt-3 font-['Space_Grotesk'] text-2xl font-bold">Cost breakdown</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              This panel updates as you edit fields, so you can see how each section changes the final quote.
            </p>

            <div className="mt-6 space-y-3 text-sm">
              {data.quantity > 1 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Per unit cost</span>
                  <span className="font-semibold">{currency.symbol} {costs.perUnitPrice.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Material total</span>
                <span className="font-semibold">{currency.symbol} {costs.materialCost.toFixed(2)}</span>
              </div>
              {data.includeMultiColor && (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">Model filament</span>
                    <span className="font-semibold">{currency.symbol} {costs.modelMaterialCost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">Purged filament</span>
                    <span className="font-semibold">{currency.symbol} {costs.purgeMaterialCost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">Tower filament</span>
                    <span className="font-semibold">{currency.symbol} {costs.towerMaterialCost.toFixed(2)}</span>
                  </div>
                </>
              )}
              {data.failureRate > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Failure buffer ({data.failureRate}%)</span>
                  <span className="font-semibold">{currency.symbol} {costs.failureCost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Electricity</span>
                <span className="font-semibold">{currency.symbol} {costs.electricityCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Labor</span>
                <span className="font-semibold">{currency.symbol} {costs.laborCost.toFixed(2)}</span>
              </div>
              {costs.prepLaborCost > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Prep time labor</span>
                  <span className="font-semibold">{currency.symbol} {costs.prepLaborCost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Post-processing</span>
                <span className="font-semibold">{currency.symbol} {costs.postProcessingCost.toFixed(2)}</span>
              </div>
              {data.includeDepreciation && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-300">Depreciation</span>
                  <span className="font-semibold">{currency.symbol} {costs.depreciationCost.toFixed(2)}</span>
                </div>
              )}
              <div className="my-2 border-t border-white/10" />
              <div className="flex items-center justify-between gap-4 text-base">
                <span className="font-semibold text-slate-200">Subtotal</span>
                <span className="font-bold">{currency.symbol} {costs.totalCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Markup</span>
                <span className="font-semibold">{currency.symbol} {costs.markupPrice.toFixed(2)}</span>
              </div>
              {data.taxRate > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-300">Tax ({data.taxRate}%)</span>
                  <span className="font-semibold">{currency.symbol} {costs.taxAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-emerald-400/20 bg-emerald-400/10 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Final price</div>
              <div className="mt-2 text-3xl font-bold text-white">{currency.symbol} {costs.finalPrice.toFixed(2)}</div>
              {data.quantity > 1 && (
                <div className="mt-1 text-sm text-emerald-200/80">
                  {currency.symbol} {costs.perUnitPrice.toFixed(2)} per unit × {data.quantity}
                </div>
              )}
              {data.includeMultiColor && (
                <div className="mt-3 text-sm text-emerald-50/90">
                  Effective print time: {effectivePrintTimeLabel}
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3">
              <button
                onClick={onGeneratePdf}
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Generate PDF
              </button>
              <button
                onClick={onSave}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Save to History
              </button>
              <button
                onClick={onViewHistory}
                className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Browse Saved Prints
              </button>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
};

export default CalculatorView;
