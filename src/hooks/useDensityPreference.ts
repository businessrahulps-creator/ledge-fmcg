import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ledge:command:density";
type Density = "comfortable" | "dense";

function read(): Density {
  if (typeof window === "undefined") return "comfortable";
  return (localStorage.getItem(STORAGE_KEY) as Density) || "comfortable";
}

export function useDensityPreference() {
  const [density, setDensity] = useState<Density>(read);

  const toggle = useCallback(() => {
    setDensity((d) => (d === "dense" ? "comfortable" : "dense"));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, density);
    } catch {
      /* private mode */
    }
  }, [density]);

  return { density, toggle, setDensity };
}
