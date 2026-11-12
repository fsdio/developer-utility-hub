/** Deklarasi tipe minimal untuk jest-axe (paket belum membawa tipe untuk vitest). */
declare module "jest-axe" {
  import type { AxeResults, ElementContext, RunOptions } from "axe-core";

  export const axe: (
    context?: ElementContext,
    options?: RunOptions,
  ) => Promise<AxeResults>;

  export function configureAxe(options?: RunOptions): typeof axe;
}
