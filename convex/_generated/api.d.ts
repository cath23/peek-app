/* eslint-disable */
/**
 * Generated API.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * Hand-written to the standard template so the repo typechecks before the
 * first `npx convex dev` run (which regenerates this file).
 */
import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
import type * as dev_seedDemo from "../dev/seedDemo.js";

declare const fullApi: ApiFromModules<{
  "dev/seedDemo": typeof dev_seedDemo;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
