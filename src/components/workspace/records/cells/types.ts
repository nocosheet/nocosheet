import type { RenderEditCellContentProps } from "react-data-grid";

import type { ViewerColumn } from "../columns";
import type { ViewerRow } from "../records-grid";

export type CellProps = { column: ViewerColumn; value: unknown };

export type EditorProps = Omit<RenderEditCellContentProps<ViewerRow>, "column"> & {
  workspace: string;
  column: ViewerColumn;
};

export type CellMode = "readonly" | "toggle" | "input" | "popup" | "sheet";
