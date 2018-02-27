import {
  chart1,
  chart2,
  chart3,
  chart4,
  chart5,
  chart6,
  chart7,
  chart8,
  chart9,
  chart10,
  chart11,
  chart12,
  chart13,
  chart14,
  chart15,
  chart16,
  chart17,
  chart18,
  chart19,
  chart20,
  chart21,
  chart22,
  chart23,
  chart24,
  chart25,
  chart26,
  chart27,
  chart28,
  chart29,
  chart30,
  chart31,
  chart32,
  chart33,
  chart34,
  chart35

} from '../styles/variables';

export const routes = {
  index: { route: '/', translateId: 'departmentSuccess' },
  populations: { route: '/populations', translateId: 'populations' },
  courses: { route: '/courses', translateId: 'courses' },
  students: { route: '/students', translateId: 'students' },
  teachers: { route: '/teachers,', translateId: 'teachers' }
};

const assumeBasename = () => {
  const POSSIBLE_BASENAMES = ['staging'];
  const haystack = window.location.pathname.split('/');
  const needle = haystack.find(path => POSSIBLE_BASENAMES.includes(path));
  return needle || '/';
};

export const BASE_PATH = assumeBasename();

export const AVAILABLE_LANGUAGES = ['en'];
export const DEFAULT_LANG = 'en';

export const DISPLAY_DATE_FORMAT = 'DD.MM.YYYY';
export const API_DATE_FORMAT = 'YYYY.MM.DD';

export const CHART_COLORS = [
  chart1,
  chart2,
  chart3,
  chart4,
  chart5,
  chart6,
  chart7,
  chart8,
  chart9,
  chart10,
  chart11,
  chart12,
  chart13,
  chart14,
  chart15,
  chart16,
  chart17,
  chart18,
  chart19,
  chart20,
  chart21,
  chart22,
  chart23,
  chart24,
  chart25,
  chart26,
  chart27,
  chart28,
  chart29,
  chart30,
  chart31,
  chart32,
  chart33,
  chart34,
  chart35
];
