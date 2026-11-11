import { AttachmentCell } from "./cells/attachment-cell";
import { CheckboxCell } from "./cells/checkbox-cell";
import { DateCell } from "./cells/date-cell";
import { INPUT_FORMATS, InputEditor } from "./cells/input-editor";
import { LongTextCell, TextareaEditor } from "./cells/long-text-cell";
import { NumberCell } from "./cells/number-cell";
import { RatingCell } from "./cells/rating-cell";
import { RelationCell, RelationEditor } from "./cells/relation-cell";
import { MultiSelectEditor, SelectCell, SingleSelectEditor } from "./cells/select-cell";
import { TextCell } from "./cells/text-cell";
import type { CellMode, EditorProps } from "./cells/types";
import { UserCell } from "./cells/user-cell";
import type { ViewerColumn } from "./columns";

export type { CellMode };

export function cellMode(column: ViewerColumn): CellMode {
  if (column.readOnly) return "readonly";
  if (column.format === "checkbox") return "toggle";
  if (
    column.format === "single_select" ||
    column.format === "multi_select" ||
    column.format === "relation" ||
    column.format === "long_text" ||
    column.format === "json"
  )
    return "popup";
  if (INPUT_FORMATS.includes(column.format)) return "input";
  return "sheet";
}

export function CellValue({ column, value }: { column: ViewerColumn; value: unknown }) {
  if (value === null || value === undefined || value === "") return null;

  switch (column.format) {
    case "integer":
    case "decimal":
    case "percent":
    case "currency":
    case "duration":
      return <NumberCell column={column} value={value} />;
    case "rating":
      return <RatingCell column={column} value={value} />;
    case "created_at":
    case "updated_at":
    case "date":
    case "datetime":
    case "datetime_tz":
      return <DateCell column={column} value={value} />;
    case "checkbox":
      return <CheckboxCell column={column} value={value} />;
    case "single_select":
    case "multi_select":
      return <SelectCell column={column} value={value} />;
    case "relation":
      return <RelationCell column={column} value={value} />;
    case "user":
      return <UserCell column={column} value={value} />;
    case "file":
    case "image":
    case "binary":
      return <AttachmentCell column={column} value={value} />;
    case "long_text":
    case "json":
      return <LongTextCell column={column} value={value} />;
    default:
      return <TextCell column={column} value={value} />;
  }
}

export function CellEditor(props: EditorProps) {
  switch (props.column.format) {
    case "single_select":
      return <SingleSelectEditor {...props} />;
    case "multi_select":
      return <MultiSelectEditor {...props} />;
    case "long_text":
    case "json":
      return <TextareaEditor {...props} />;
    case "relation":
      return <RelationEditor {...props} />;
    default:
      return <InputEditor {...props} />;
  }
}
