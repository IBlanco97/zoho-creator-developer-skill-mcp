import type { PlatformAdapter } from "../types.js";
import { ctaimaAdapter } from "./ctaima.js";
import { dokifyAdapter } from "./dokify.js";
import { nalandaAdapter } from "./nalanda.js";
import { ucaeAdapter } from "./ucae.js";
import { genericEmailFallback } from "./generic.js";

export const adapters: PlatformAdapter[] = [
  ucaeAdapter,
  ctaimaAdapter,
  dokifyAdapter,
  nalandaAdapter,
];

export function pickAdapter(creds: { url: string }): PlatformAdapter {
  return adapters.find((a) => a.match(creds as never)) ?? genericEmailFallback;
}
