export const hasFullAccessToTeacherData = (roles: string[], iamGroups: string[]) =>
  roles.some(role => role === 'admin') ||
  iamGroups.some(group => ['hy-dekaanit', 'hy-varadekaanit-opetus'].includes(group))
