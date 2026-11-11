import {
  AtSignIcon,
  BracesIcon,
  CalendarIcon,
  CalendarClockIcon,
  CheckSquareIcon,
  ClockIcon,
  DollarSignIcon,
  FileIcon,
  GlobeIcon,
  HashIcon,
  ImageIcon,
  LinkIcon,
  ListIcon,
  ListChecksIcon,
  PaletteIcon,
  PercentIcon,
  PhoneIcon,
  RulerIcon,
  StarIcon,
  TimerIcon,
  TypeIcon,
  AlignLeftIcon,
  BinaryIcon,
  type LucideIcon,
} from "lucide-react";

export const SQLITE_TYPES = ["integer", "real", "text", "blob"] as const;
export type SqliteType = (typeof SQLITE_TYPES)[number];

export const FORMAT_GROUPS = [
  "Text",
  "Number",
  "Boolean",
  "Choice",
  "Date & time",
  "Files",
  "Relation",
  "Other",
] as const;
export type FormatGroup = (typeof FORMAT_GROUPS)[number];

export type DefaultKind = "text" | "boolean" | "choice";

export type FormatDefinition = {
  label: string;
  group: FormatGroup;
  type: SqliteType | null;
  icon: LucideIcon;
  defaultKind: DefaultKind | null;
};

export const FORMATS = {
  text: {
    label: "Single line text",
    group: "Text",
    type: "text",
    icon: TypeIcon,
    defaultKind: "text",
  },
  long_text: {
    label: "Long text",
    group: "Text",
    type: "text",
    icon: AlignLeftIcon,
    defaultKind: "text",
  },
  email: { label: "Email", group: "Text", type: "text", icon: AtSignIcon, defaultKind: "text" },
  url: { label: "URL", group: "Text", type: "text", icon: LinkIcon, defaultKind: "text" },
  phone: { label: "Phone", group: "Text", type: "text", icon: PhoneIcon, defaultKind: "text" },
  color: { label: "Color", group: "Text", type: "text", icon: PaletteIcon, defaultKind: "text" },

  integer: {
    label: "Integer",
    group: "Number",
    type: "integer",
    icon: HashIcon,
    defaultKind: "text",
  },
  decimal: {
    label: "Decimal",
    group: "Number",
    type: "real",
    icon: RulerIcon,
    defaultKind: "text",
  },
  percent: {
    label: "Percent",
    group: "Number",
    type: "real",
    icon: PercentIcon,
    defaultKind: "text",
  },
  currency: {
    label: "Currency",
    group: "Number",
    type: "real",
    icon: DollarSignIcon,
    defaultKind: "text",
  },
  rating: {
    label: "Rating",
    group: "Number",
    type: "integer",
    icon: StarIcon,
    defaultKind: "text",
  },
  duration: {
    label: "Duration",
    group: "Number",
    type: "integer",
    icon: TimerIcon,
    defaultKind: "text",
  },

  checkbox: {
    label: "Checkbox",
    group: "Boolean",
    type: "integer",
    icon: CheckSquareIcon,
    defaultKind: "boolean",
  },

  single_select: {
    label: "Single select",
    group: "Choice",
    type: "text",
    icon: ListIcon,
    defaultKind: "choice",
  },
  multi_select: {
    label: "Multiple select",
    group: "Choice",
    type: "text",
    icon: ListChecksIcon,
    defaultKind: null,
  },

  date: {
    label: "Date",
    group: "Date & time",
    type: "text",
    icon: CalendarIcon,
    defaultKind: null,
  },
  time: { label: "Time", group: "Date & time", type: "text", icon: ClockIcon, defaultKind: null },
  datetime: {
    label: "Date and time",
    group: "Date & time",
    type: "integer",
    icon: CalendarClockIcon,
    defaultKind: null,
  },
  datetime_tz: {
    label: "Date and time with time zone",
    group: "Date & time",
    type: "text",
    icon: GlobeIcon,
    defaultKind: null,
  },

  file: { label: "File", group: "Files", type: "text", icon: FileIcon, defaultKind: null },
  image: { label: "Image", group: "Files", type: "text", icon: ImageIcon, defaultKind: null },

  relation: {
    label: "Link to another table",
    group: "Relation",
    type: null,
    icon: LinkIcon,
    defaultKind: null,
  },

  json: { label: "JSON", group: "Other", type: "text", icon: BracesIcon, defaultKind: null },
  binary: { label: "Binary", group: "Other", type: "blob", icon: BinaryIcon, defaultKind: null },
} as const satisfies Record<string, FormatDefinition>;

export type ColumnFormat = keyof typeof FORMATS;

export const COLUMN_FORMATS = Object.keys(FORMATS) as [ColumnFormat, ...ColumnFormat[]];

export const formatsByGroup = FORMAT_GROUPS.map((group) => ({
  group,
  formats: COLUMN_FORMATS.filter((format) => FORMATS[format].group === group),
}));

export const SEARCHABLE_FORMATS: ColumnFormat[] = ["text", "long_text"];

export const TITLE_FORMATS: ColumnFormat[] = [
  "text",
  "long_text",
  "email",
  "url",
  "phone",
  "integer",
  "decimal",
  "percent",
  "currency",
  "rating",
  "duration",
  "single_select",
  "date",
  "time",
  "datetime",
  "datetime_tz",
  "checkbox",
];

export const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "INR", "PKR", "AED", "CAD", "AUD", "CNY"];

export const DURATION_DISPLAYS = [
  { value: "h:mm", label: "Hours and minutes (1:30)" },
  { value: "h:mm:ss", label: "Hours, minutes and seconds (1:30:00)" },
  { value: "seconds", label: "Seconds (5400)" },
] as const;

export const RELATION_ON_DELETE = [
  { value: "set null", label: "Clear the link" },
  { value: "cascade", label: "Delete this record too" },
  { value: "restrict", label: "Block the delete" },
] as const;

export type RelationOnDelete = (typeof RELATION_ON_DELETE)[number]["value"];

export type SelectChoice = { label: string; value: string };

export const choiceLabel = (options: Record<string, unknown>, value: string) =>
  ((options.choices as SelectChoice[] | undefined) ?? []).find((choice) => choice.value === value)
    ?.label ?? value;

export const choiceIndex = (options: Record<string, unknown>, value: string) =>
  Math.max(
    0,
    ((options.choices as SelectChoice[] | undefined) ?? []).findIndex(
      (choice) => choice.value === value,
    ),
  );
