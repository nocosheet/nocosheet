import { CloudIcon, CodeXmlIcon, MousePointerClickIcon, Table2Icon } from "lucide-react";

const features = [
  {
    icon: MousePointerClickIcon,
    title: "Fully no-code",
    description: "Create tables, fields and relations straight from the UI.",
  },
  {
    icon: Table2Icon,
    title: "Spreadsheet-style grid",
    description: "Browse and edit your records the way you already work.",
  },
  {
    icon: CloudIcon,
    title: "Self-host on Cloudflare",
    description: "Runs on your own account with Workers, D1, R2 and more.",
  },
  {
    icon: CodeXmlIcon,
    title: "Open source",
    description: "Read the code, extend it and make it yours.",
  },
];

export function AuthBrandPanel() {
  return (
    <aside className="hidden flex-col justify-center gap-8 border-l bg-muted/50 p-10 md:flex">
      <div className="flex flex-col gap-2">
        <h2 className="font-semibold text-2xl leading-tight tracking-tight">
          Your data, modelled and published without code.
        </h2>
        <p className="text-muted-foreground text-sm">
          An open-source no-code CMS and spreadsheet-style database.
        </p>
      </div>
      <ul className="flex flex-col gap-5">
        {features.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background">
              <Icon className="size-4" />
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="font-medium text-sm">{title}</p>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
