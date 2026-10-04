import { TOGGLEABLE_CAPS, type CapabilityKey } from "./accessCopy";
import { CapabilityToggleRow } from "./CapabilityToggleRow";
import type { CapState } from "./useOverrideEditor";

/** Shared list of access areas — used by the invite sheet and the "Change access" drawer. */
export function AccessAreaList({
  current, roleDefaults, jobLabel, onChange,
}: {
  current: CapState;
  roleDefaults: CapState;
  jobLabel: string;
  onChange: (key: CapabilityKey, value: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      {TOGGLEABLE_CAPS.map((cap) => (
        <CapabilityToggleRow
          key={cap.key}
          icon={cap.icon}
          label={cap.label}
          description={cap.sub}
          jobLabel={jobLabel}
          checked={!!current[cap.key]}
          defaultOn={!!roleDefaults[cap.key]}
          onChange={(v) => onChange(cap.key, v)}
        />
      ))}
    </div>
  );
}

/** Only the areas that differ from the role's defaults — what the server stores. */
export function diffFromDefaults(current: CapState, roleDefaults: CapState): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const { key } of TOGGLEABLE_CAPS) {
    if (!!current[key] !== !!roleDefaults[key]) out[key] = !!current[key];
  }
  return out;
}
