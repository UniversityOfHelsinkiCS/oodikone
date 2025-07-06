// This is locked behind admin check.
// We probably want to keep it on the server side and not share it.
export const roles = [
  'admin',
  'courseStatistics',
  'facultyStatistics',
  'fullSisuAccess',
  'openUniSearch',
  'studyGuidanceGroups',
  'teachers',
] as const
