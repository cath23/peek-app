/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as desk from "../desk.js";
import type * as dev_seedDates from "../dev/seedDates.js";
import type * as dev_seedDemo from "../dev/seedDemo.js";
import type * as http from "../http.js";
import type * as huddles from "../huddles.js";
import type * as messages from "../messages.js";
import type * as otp from "../otp.js";
import type * as people from "../people.js";
import type * as replies from "../replies.js";
import type * as topics from "../topics.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  desk: typeof desk;
  "dev/seedDates": typeof dev_seedDates;
  "dev/seedDemo": typeof dev_seedDemo;
  http: typeof http;
  huddles: typeof huddles;
  messages: typeof messages;
  otp: typeof otp;
  people: typeof people;
  replies: typeof replies;
  topics: typeof topics;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
