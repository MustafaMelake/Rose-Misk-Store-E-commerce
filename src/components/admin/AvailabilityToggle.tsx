"use client";

/**
 * Available / Not Available switch for a product variant. Replaces the old
 * numeric stock input — the store no longer tracks exact quantities, only
 * whether a volume can be ordered.
 */
export default function AvailabilityToggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  id?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={checked ? "Available" : "Not available"}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold-base focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black cursor-pointer ${
          checked ? "bg-gold-base" : "bg-zinc-300 dark:bg-zinc-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <span
        className={`text-sm font-medium ${
          checked
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        {checked ? "Available" : "Not Available"}
      </span>
    </div>
  );
}
