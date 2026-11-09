import { Fragment } from "react";

import { Link, useMatches } from "@tanstack/react-router";

import { HomeIcon } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { RouteCrumb } from "@/lib/breadcrumbs";

function resolveCrumb(crumb: RouteCrumb, loaderData: unknown) {
  return typeof crumb === "function" ? crumb(loaderData) : crumb;
}

/**
 * Home icon first, then one item per matched route that declares `staticData.crumb`. On the home
 * page there are no such routes, so only the icon shows.
 */
export function WorkspaceBreadcrumbs({ workspace }: { workspace: string }) {
  const crumbs = useMatches({
    select: (matches) =>
      matches.flatMap((match) => {
        const crumb = match.staticData.crumb;
        const label = crumb ? resolveCrumb(crumb, match.loaderData) : undefined;
        return label ? [{ id: match.id, label, pathname: match.pathname }] : [];
      }),
  });
  const atHome = crumbs.length === 0;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {atHome ? (
            <BreadcrumbPage aria-label="Home">
              <HomeIcon className="size-4" />
            </BreadcrumbPage>
          ) : (
            <BreadcrumbLink
              aria-label="Home"
              render={<Link to="/w/$workspace" params={{ workspace }} />}
            >
              <HomeIcon className="size-4" />
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <Fragment key={crumb.id}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {last ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link to={crumb.pathname} />}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
