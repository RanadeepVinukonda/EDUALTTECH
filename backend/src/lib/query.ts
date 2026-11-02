import { z } from "zod";

/**
 * Strict boolean query parameter. `z.coerce.boolean()` treats every non-empty
 * string (including "false") as true, which silently inverts filters.
 */
export const booleanQuery = z
  .enum(["true", "false"])
  .transform((value) => value === "true");
