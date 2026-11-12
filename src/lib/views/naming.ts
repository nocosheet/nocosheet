import { randomKey } from "../tables/naming";

export const newViewName = randomKey;

export const physicalViewName = (workspace: string, viewName: string) =>
  `${workspace}__v_${viewName}`;
