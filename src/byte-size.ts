export const BACKUP_LIMIT = 100 * 1024 * 1024;
export function utf8Size(value: string) {
  let bytes = 0;
  for (const character of value) {
    const point = character.codePointAt(0)!;
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
  }
  return bytes;
}
export function assertBackupSize(bytes: number) {
  if (bytes > BACKUP_LIMIT)
    throw new Error(
      "Choose a backup smaller than 100 MB. Remove unneeded attachment conversations before exporting.",
    );
}
