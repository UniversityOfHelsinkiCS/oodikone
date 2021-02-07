import { orderBy } from "lodash";

const sortAlternatives = alternatives =>
  orderBy(
    alternatives,
    [
      a => {
        if (a.code.match(/^A/)) return 4; // open university codes come last
        if (a.code.match(/^\d/)) return 2; // old numeric codes come second
        if (a.code.match(/^[A-Za-z]/)) return 1; // new letter based codes come first
        return 3; // unknown, comes before open uni?
      },
      a => a.latestInstanceDate || new Date(),
      "code"
    ],
    ["asc", "desc", "desc"]
  );
const isAvoin = code => !!code.match(/^AY?(.+?)(?:en|fi|sv)?$/);
const fixGroups = groupsArgs => {
  const notAvoin = new Set();
  const groups = {};

  Object.entries(groupsArgs).forEach(([code, parentCode]) => {
    groups[code] = parentCode;

    // handle special case where the course's actual code starts with "A" so it is mistakenly taken as Open Uni course
    if (groupsArgs[`AY${code}`] && code.startsWith("A")) {
      groups[code] = code;
      notAvoin.add(code);
    }
  });

  return { groups, notAvoin };
};
const mergeCourses = (groupsArgs, courses, groupMeta, unifyOpenUniCourses = false) => {
  const mergedCourses = {};

  const { groups, notAvoin } = fixGroups(groupsArgs);

  courses
    // Sort the codes so that we know non-Open Uni courses come up first
    .sort((a, b) => a.code.length - b.code.length)
    .forEach(course => {
      const groupId =
        isAvoin(course.code) && !notAvoin.has(course.code) && !unifyOpenUniCourses ? course.code : groups[course.code];

      // Don't show courses without attainments
      if (!(course.max_attainment_date && course.min_attainment_date)) {
        return;
      }

      if (!mergedCourses[groupId]) {
        mergedCourses[groupId] = {
          ...course,
          code: (groupMeta[groupId] && groupMeta[groupId].code) || course.code,
          name: (groupMeta[groupId] && groupMeta[groupId].name) || course.name,
          alternatives: [{ code: course.code, latestInstanceDate: new Date(course.latest_instance_date) }],
          min_attainment_date: new Date(course.min_attainment_date),
          max_attainment_date: new Date(course.max_attainment_date)
        };
      } else {
        const mergedCourse = mergedCourses[groupId];
        mergedCourse.min_attainment_date = new Date(
          Math.min(mergedCourse.min_attainment_date, new Date(course.min_attainment_date))
        );
        mergedCourse.max_attainment_date = new Date(
          Math.max(mergedCourse.max_attainment_date, new Date(course.max_attainment_date))
        );
        mergedCourse.alternatives.push({
          code: course.code,
          latestInstanceDate: new Date(course.latest_instance_date)
        });
      }
    });

  return Object.values(mergedCourses).map(c => ({
    ...c,
    // If special case of Open Uni course that starts with A let's just sort them length, that
    // should be good enough in this case.
    alternatives: c.alternatives.some(course => notAvoin.has(course.code))
      ? c.alternatives.sort((a, b) => a.code.length - b.code.length)
      : sortAlternatives(c.alternatives)
  }));
};
export { mergeCourses };