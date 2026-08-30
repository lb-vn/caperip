import { topCities } from "$lib/server/speeds";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => ({ cities: await topCities() });
