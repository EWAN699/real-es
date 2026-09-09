import type { FormEvent } from 'react';

import { dealTypeLabels } from '@/content/listings';
import type { AssetType, DealType } from '@/content/types';
import { Field, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { assetTypeLabels } from './labels';

/**
 * The listings filter bar: city, deal type, asset type.
 *
 * Everything it offers is derived from the listings that actually exist, so a
 * visitor can never pick a combination that returns nothing because the option
 * was hardcoded. Selecting applies immediately; the submit button is there for
 * anyone who expects a form to have one, and for the browser's own
 * Enter-in-a-form behaviour.
 *
 * State lives in the URL, one level up. That is what makes a filtered view
 * linkable and shareable, and it is what lets the legacy `property_buyorrent`
 * taxonomy archives redirect straight onto `/listings?deal=sale`.
 *
 * `ALL` is the empty option's value rather than an empty string: an empty
 * `<option>` value is indistinguishable from "no answer yet" in some assistive
 * technology, and it reads better as a real choice.
 */
export const ALL = 'all';

export type ListingFilterValues = {
  city: string;
  deal: DealType | '';
  asset: AssetType | '';
};

export type ListingFiltersProps = {
  values: ListingFilterValues;
  cities: readonly string[];
  deals: readonly DealType[];
  assets: readonly AssetType[];
  onChange: (next: Partial<ListingFilterValues>) => void;
  onReset: () => void;
  /** True when at least one filter is applied, so the reset is not offered idly. */
  isFiltered: boolean;
};

export function ListingFilters({
  values,
  cities,
  deals,
  assets,
  onChange,
  onReset,
  isFiltered,
}: ListingFiltersProps) {
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    // Filtering already happened on change; this stops a reload that would
    // throw the selection away.
    event.preventDefault();
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-labelledby="filters-title"
      className="rounded-lg border border-stone-200 bg-stone-50 p-6"
    >
      <h2 id="filters-title" className="text-h3 font-bold text-ink-900">
        סינון נכסים
      </h2>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <Field label="עיר">
          <Select
            name="city"
            value={values.city === '' ? ALL : values.city}
            onChange={(event) =>
              onChange({ city: event.target.value === ALL ? '' : event.target.value })
            }
          >
            <option value={ALL}>כל הערים</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="סוג עסקה">
          <Select
            name="deal"
            value={values.deal === '' ? ALL : values.deal}
            onChange={(event) =>
              onChange({
                deal: event.target.value === ALL ? '' : (event.target.value as DealType),
              })
            }
          >
            <option value={ALL}>כל סוגי העסקאות</option>
            {deals.map((deal) => (
              <option key={deal} value={deal}>
                {dealTypeLabels[deal]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="סוג נכס">
          <Select
            name="asset"
            value={values.asset === '' ? ALL : values.asset}
            onChange={(event) =>
              onChange({
                asset: event.target.value === ALL ? '' : (event.target.value as AssetType),
              })
            }
          >
            <option value={ALL}>כל סוגי הנכסים</option>
            {assets.map((asset) => (
              <option key={asset} value={asset}>
                {assetTypeLabels[asset]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary">
          הצגת התוצאות
        </Button>

        {isFiltered ? (
          <Button type="button" variant="ghost" onClick={onReset}>
            ניקוי הסינון
          </Button>
        ) : null}
      </div>

      <noscript>
        {/* Filtering is client-side over a prerendered list. With no script the
            page still shows every property — the honest fallback is the full
            list, not an empty one. */}
        <p className="mt-4 text-small text-ink-600">
          הסינון פועל בדפדפן. ללא JavaScript מוצגים כל הנכסים ברשימה שמתחת.
        </p>
      </noscript>
    </form>
  );
}
