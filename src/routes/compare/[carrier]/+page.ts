import { error } from "@sveltejs/kit";
import plansData from "$lib/data/plans.json";
import type { Plan } from "$lib/types";
import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params }) => {
  const slug = params.carrier;
  const carrier = (plansData as Record<string, Plan>)[
    slug.replace(/^cape-vs-/, "")
  ];

  if (!slug.startsWith("cape-vs-") || !carrier || carrier.slug === "cape") {
    throw error(404, "Carrier not found");
  }

  return { cape: plansData.cape as Plan, carrier, slug };
};
