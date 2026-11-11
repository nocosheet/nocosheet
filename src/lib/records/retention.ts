export const TRASH_RETENTION_DAYS = 30;

export const trashExpiry = (deletedAt: number) =>
  deletedAt + TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
