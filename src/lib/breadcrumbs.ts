import "@tanstack/react-router";

/**
 * A route's label in the breadcrumb trail. A function receives the route's loader data, for
 * titles that come from data (e.g. a member's name).
 */
export type RouteCrumb = string | ((loaderData: unknown) => string | undefined);

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    crumb?: RouteCrumb;
  }
}
