export const routes = {
  index: { route: '/', translateId: 'departmentSuccess' },
  populations: { route: '/populations', translateId: 'populations' },
  students: { route: '/students', translateId: 'students' },
  courses: { route: '/courses', translateId: 'courses' },
  teachers: { route: '/teachers,', translateId: 'teachers' }
};

/* TODO: set this configurable? */
export const BASE_PATH = '';

export const AVAILABLE_LANGUAGES = ['en'];
export const DEFAULT_LANG = 'en';

export const DISPLAY_DATE_FORMAT = 'DD.MM.YYYY';
export const API_DATE_FORMAT = 'YYYY.MM.DD';
