# nocosheet

nocosheet is an open-source, fully no-code CMS and spreadsheet-style database. Model your data, manage records and publish content without writing code. It is self-hostable on Cloudflare and uses Cloudflare services for everything it needs.

## Features

### Available

- **No-code data modeling**: create tables and fields from the UI with a guided new-table wizard; schema changes are applied live
- **Spreadsheet-style grid**: browse and edit records in a fast, familiar grid
- **File uploads**: attach and manage files on records
- **Advanced field types**: select and multi-select, dates, currency, attachments and computed fields
- **Trash and recovery**: deleted tables are soft-deleted, protected by dependency checks and purged after 30 days
- **Roles and permissions**: dynamic workspace roles, one per member, with workspace-level and per-table grants, own/all record scopes and an admin role above all
- **Members**: invite and manage people in your workspace
- **Self-hosted on Cloudflare**: Workers, D1 and R2 on your own account, with no external services required

### Planned

- **Offline-first**: records stay usable without a connection and sync when you are back online
- **Views**: saved filters, sorting, grouping and hidden columns, plus kanban, gallery, calendar and form layouts
- **Forms**: shareable forms that write straight into a table
- **Content publishing**: draft and publish workflow, scheduled publishing and revision history
- **REST API and API keys**: read and write records programmatically with scoped tokens
- **Webhooks and automations**: trigger actions when records change
- **Import and export**: CSV and JSON in and out, with column mapping
- **Audit log**: a full history of who changed what and when
- **Comments and activity**: discuss records and follow changes
- **Multi-workspace**: several workspaces per deployment, powering an optional managed version
- **Templates**: start from ready-made table and workspace setups

## Self-hosting

nocosheet runs entirely on your Cloudflare account. Deploy it as a Worker, bind a D1 database and an R2 bucket, and you are done.

## Contributing

nocosheet is open source and contributions are welcome. Open an issue to discuss an idea or send a pull request.
