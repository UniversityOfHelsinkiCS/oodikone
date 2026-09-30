type ExportModule = {
  courses: { code: string; groupId: string }[]
}

/**
 * Student rows are keyed by course groupId, which is not readable.
 * Maps each course column's groupId to its course code for use as a key (and header) in the Excel export.
 */
export const getGroupIdToExportKey = (modules: Map<string, ExportModule>): Record<string, string> => {
  const groupIdToExportKey: Record<string, string> = {}
  const usedKeys = new Set<string>()

  for (const { courses } of modules.values()) {
    for (const { code, groupId } of courses) {
      if (groupId in groupIdToExportKey) continue

      const key = usedKeys.has(code) ? `${code} (${groupId})` : code
      groupIdToExportKey[groupId] = key
      usedKeys.add(key)
    }
  }

  return groupIdToExportKey
}

export const renameKeys = <T extends object>(row: T, keyMap: Record<string, string>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(row).map(([key, value]) => [keyMap[key] ?? key, value]))
