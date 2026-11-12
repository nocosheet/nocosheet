import { newKey } from "../tables/naming";

export const newViewName = () => newKey("v");

export const physicalViewName = (workspace: string, viewName: string) =>
  `${workspace}__${viewName}`;
