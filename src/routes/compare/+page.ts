import plansData from "$lib/data/plans.json";
import type { Plan } from "$lib/types";
import type { PageLoad } from "./$types";

export const load: PageLoad = () => {
  const plans = (Object.values(plansData) as Plan[]).sort(
    (a, b) => a.pricePerLine[0] - b.pricePerLine[0],
  );

  return {
    plans,
    cape: plansData.cape as Plan,
    carriers: plans
      .filter((p) => p.slug !== "cape")
      .map((p) => ({ slug: `cape-vs-${p.slug}`, name: p.name, carrier: p })),
  };
};
