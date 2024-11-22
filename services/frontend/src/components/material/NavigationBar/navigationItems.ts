export type NavigationItem = {
  key: string
  label: string
  path?: string
  reqRights?: string[]
  items?: NavigationItem[]
}

export const navigationItems: Record<string, NavigationItem> = {
  university: { key: 'university', label: 'University', path: '/university' },
  faculty: { key: 'faculties', label: 'Faculties', path: '/faculties' },
  populations: {
    key: 'studyProgramme',
    items: [
      { key: 'class', label: 'Class statistics', path: '/populations' },
      { key: 'overview', label: 'Overview', path: '/study-programme' },
    ],
    label: 'Programmes',
  },
  courseStatistics: { key: 'courseStatistics', label: 'Courses', path: '/coursestatistics' },
  students: { key: 'students', label: 'Students', path: '/students' },
  teachers: { key: 'teachers', label: 'Teachers', path: '/teachers' },
  studyGuidanceGroups: {
    key: 'studyGuidanceGroups',
    label: 'Guidance groups',
    path: '/studyguidancegroups',
    reqRights: ['studyGuidanceGroups'],
  },
  customPopulations: {
    key: 'customPopulation',
    items: [
      { key: 'customSearch', label: 'Custom population', path: '/custompopulation' },
      { key: 'openUniSearch', label: 'Fetch open uni students by courses', path: '/openunipopulation' },
      { key: 'completedCoursesSearch', label: 'Completed courses of students', path: '/completedcoursessearch' },
      { key: 'languageCenterView', label: 'Language center view', path: '/languagecenterview' },
      { key: 'closeToGraduation', label: 'Students close to graduation', path: '/close-to-graduation' },
    ],
    label: 'Special populations',
  },
  feedback: { key: 'feedback', label: 'Feedback', path: '/feedback' },
  admin: {
    key: 'admin',
    items: [
      { key: 'users', label: 'Users', path: '/users', reqRights: ['admin'] },
      { key: 'updater', label: 'Updater', path: '/updater', reqRights: ['admin'] },
    ],
    label: 'Admin',
  },
}
