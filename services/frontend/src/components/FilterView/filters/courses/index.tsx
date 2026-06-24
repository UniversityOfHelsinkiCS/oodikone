import { FilterSearchableSelect } from '@/components/FilterView/filters/common/FilterSearchableSelect'
import { CourseCard } from '@/components/FilterView/filters/courses/CourseCard'
import { FilterType } from '@/components/FilterView/filters/courses/filterType'
import { createFilter, FilterTrayProps } from '@/components/FilterView/filters/createFilter'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { CourseStats } from '@oodikone/shared/routes/populations'
import { CreditTypeCode, FormattedStudent } from '@oodikone/shared/types'
import { getSortRank } from '@oodikone/shared/util/sortRank'

type FTValue = (typeof FilterType)[keyof typeof FilterType]
type Options = {
  courseFilters: Record<string, FTValue>
  courses: Record<string, CourseStats>
  substitutedBy: Record<string, string[][]>
}
type Args = { courses: CourseStats[] }
type Precompute = any

const CourseFilterCard = ({ options, onOptionsChange }: FilterTrayProps<Options, Args, Precompute>) => {
  const courseStats = options.courses

  const courseFilters = options?.courseFilters
  const { getTextIn } = useLanguage()

  const dropdownOptions = Object.values(courseStats)
    .filter(cs => !courseFilters[cs.code])
    .sort((a, b) => getSortRank(b.code) - getSortRank(a.code))
    .map(cs => ({
      key: `courseFilter-option-${cs.code}`,
      text: `${cs.code} - ${getTextIn(cs.name)}`,
      value: cs.code,
    }))

  const setCourseFilter = (code: string, type: FTValue | null) => {
    const newOpts = structuredClone(options)
    if (type === null) delete newOpts.courseFilters[code]
    else newOpts.courseFilters[code] = type

    onOptionsChange(newOpts)
  }

  return (
    <>
      <FilterSearchableSelect
        filterKey="courseFilter"
        label="Select a course"
        onChange={target => setCourseFilter(target.value, FilterType.ALL)}
        options={dropdownOptions}
        value={null}
      />
      {Object.entries(courseFilters).map(([code, type]) => (
        <CourseCard
          course={courseStats[code]}
          filterType={type}
          key={`courseFilter-selected-course-${code}`}
          onChange={type => setCourseFilter(code, type as FTValue)}
        />
      ))}
    </>
  )
}

export const courseFilter = createFilter<Options, Args, Precompute>({
  key: 'courseFilter',

  title: 'Courses',

  defaultOptions: {
    courseFilters: {},
    courses: {},
    substitutedBy: {},
  },

  precompute: ({
    args,
    options,
  }: {
    args: { courses: CourseStats[] }
    options: { courses?: Record<string, CourseStats>; substitutedBy?: Record<string, string[][]> }
  }) => {
    const substitutedBy = args.courses.reduce<Record<string, string[][]>>((acc, course: CourseStats) => {
      const { code, substitution_groups } = course
      if (substitution_groups) {
        for (const group of substitution_groups) {
          acc[code] ??= []
          acc[code].push(group)
        }
      }

      return acc
    }, {})

    /* option.courses maybe frozen even when it should be used only within the scope of createFilter factory. */ {
      delete options.courses
      options.courses = Object.fromEntries(args.courses.map(course => [course.code, course]))
    }
    options.substitutedBy = substitutedBy
  },

  isActive: ({ courseFilters }) => Object.keys(courseFilters).length > 0,

  filter(student: FormattedStudent, { options }) {
    const { courses, enrollments } = student
    const passedCoursesCodes = courses
      .filter(({ credittypecode }) => credittypecode !== CreditTypeCode.FAILED)
      .map(({ course_code }) => course_code)
    const courseCodes = courses.map(({ course_code }) => course_code)
    const enrollmentCodes = enrollments.map(({ course_code }) => course_code)
    for (const [mainCode, filterType] of Object.entries(options.courseFilters)) {
      let foundPassed = false
      let foundAttainment = false
      let foundEnrollment = false

      void [[mainCode], ...(options.substitutedBy?.[mainCode] ?? [])].forEach(group => {
        foundPassed = foundPassed ? true : group.every(code => passedCoursesCodes.includes(code))
        foundAttainment = foundAttainment ? true : group.every(code => courseCodes.includes(code))
        foundEnrollment = foundEnrollment ? true : group.every(code => enrollmentCodes.includes(code))
      })

      switch (filterType) {
        case FilterType.ALL:
          return foundEnrollment || foundAttainment
        case FilterType.PASSED:
          return foundPassed
        case FilterType.FAILED:
          return foundAttainment && !foundPassed
        case FilterType.ENROLLED_NO_GRADE:
          return foundEnrollment && !foundAttainment
        default:
          return false
      }
    }

    return true
  },

  render: CourseFilterCard,

  selectors: {
    // NOTE: Remember FilterType.ALL === 0 when checking if courseFilters[course] exists
    isCourseSelected: ({ courseFilters }, course) => Object.values(FilterType).includes(courseFilters[course]),
    selectedCourseName: ({ courses }, courseCodes) => courses[courseCodes[0]]?.name,
  },

  actions: {
    toggleCourseSelection: (options, code: string) => {
      if (!Object.values(FilterType).includes(options.courseFilters[code])) {
        options.courseFilters[code] = FilterType.ALL
      } else {
        delete options.courseFilters[code]
      }

      return options
    },
  },
})

export const { isCourseSelected } = courseFilter.selectors

export const { toggleCourseSelection } = courseFilter.actions
