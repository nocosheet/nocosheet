import {
  BugIcon,
  CalendarDaysIcon,
  ChefHatIcon,
  KanbanIcon,
  PackageIcon,
  PlaneIcon,
  ReceiptTextIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

/**
 * Placeholder tables for the sidebar and search until tables exist. Replace with real data from
 * the tables API; nothing else needs to change.
 */
export type PlaceholderTable = {
  id: string;
  name: string;
  icon: LucideIcon;
  favorite: boolean;
  records: number;
  /** Display-only "last edited" text; real data will come from `updatedAt`. */
  updated: string;
};

export const PLACEHOLDER_TABLES: PlaceholderTable[] = [
  {
    id: "projects",
    name: "Project Tracker",
    icon: KanbanIcon,
    favorite: true,
    records: 128,
    updated: "2 hours ago",
  },
  {
    id: "customers",
    name: "Customer Directory",
    icon: UsersIcon,
    favorite: true,
    records: 1240,
    updated: "Yesterday",
  },
  {
    id: "content",
    name: "Content Calendar",
    icon: CalendarDaysIcon,
    favorite: true,
    records: 46,
    updated: "3 days ago",
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: PackageIcon,
    favorite: true,
    records: 312,
    updated: "Last week",
  },
  {
    id: "bugs",
    name: "Bug Reports",
    icon: BugIcon,
    favorite: true,
    records: 87,
    updated: "Last week",
  },
  {
    id: "invoices",
    name: "Invoices",
    icon: ReceiptTextIcon,
    favorite: false,
    records: 64,
    updated: "2 weeks ago",
  },
  {
    id: "recipes",
    name: "Recipe Collection",
    icon: ChefHatIcon,
    favorite: false,
    records: 29,
    updated: "Last month",
  },
  {
    id: "travel",
    name: "Travel Plans",
    icon: PlaneIcon,
    favorite: false,
    records: 12,
    updated: "Last month",
  },
];
