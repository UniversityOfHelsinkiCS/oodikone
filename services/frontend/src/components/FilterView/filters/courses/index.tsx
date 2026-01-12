import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import type { FilterTrayProps } from '../../FilterTray'
import { FilterSearchableSelect } from '../common/FilterSearchableSelect'
import { createFilter } from '../createFilter'
import { CourseCard } from './CourseCard'
import { FilterType } from './filterType'

type CourseStats = Record<string, any>

const CourseFilterCard = ({ options, onOptionsChange }: FilterTrayProps) => {
  const courseStats: CourseStats = options.courses

  const courseFilters: Record<string, number> = options?.courseFilters
  const { getTextIn } = useLanguage()

  const dropdownOptions = Object.values(courseStats)
    .filter(cs => !courseFilters[cs.code])
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(cs => ({
      key: `courseFilter-option-${cs.code}`,
      text: `${cs.code} - ${getTextIn(cs.name)}`,
      value: cs.code,
    }))

  const setCourseFilter = (code: string, type: number | null) => {
    const newOpts = structuredClone(options)
    newOpts.courseFilters[code] = type
    if (type === null) delete newOpts.courseFilters[code]

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
          onChange={type => setCourseFilter(code, type)}
        />
      ))}
    </>
  )
}

export const courseFilter = createFilter({
  key: 'courseFilter',

  title: 'Courses',

  defaultOptions: {
    courseFilters: {},
    courses: {},
    substitutedBy: [],
  },

  precompute: ({ args, options }) => {
    const substitutedBy = args.courses.reduce(
      (acc, course) => {
        const { code, substitutions } = course
        for (const original of substitutions) {
          acc[original] ??= []
          acc[original].push(code)
        }

        return acc
      },
      {} as Record<string, string[]>
    )

    options.courses = Object.fromEntries(args.courses.map(course => [course.code, course]))
    options.substitutedBy = substitutedBy
  },

  isActive: ({ courseFilters }) => Object.keys(courseFilters).length > 0,

  filter(student, { precomputed, options }) {
    const { courses, enrollments } = student

    for (const [code, filterType] of Object.entries(options.courseFilters)) {
      const found = [code, ...(precomputed.substitutedBy[code] ?? [])].some(course => {
        const enrolled = enrollments.some(({ course_code }) => course_code === course)
        const attainment = courses.some(({ course_code }) => course_code === code)
        const passed = courses.some(({ course_code, passed }) => course_code === code && passed)

        switch (filterType) {
          case FilterType.ALL:
            return enrolled || attainment
          case FilterType.PASSED:
            return passed
          case FilterType.FAILED:
            return attainment && !passed
          case FilterType.ENROLLED_NO_GRADE:
            return enrolled && !attainment
          default:
            return false
        }
      })

      if (!found) return false
    }

    return true
  },

  render: CourseFilterCard,

  selectors: {
    isCourseSelected: ({ courseFilters }, course) => !!courseFilters[course],
    selectedCourseName: ({ courses }, courseCodes) => courses[courseCodes[0]]?.name,
  },

  actions: {
    toggleCourseSelection: (options, code) => {
      if (!options.courseFilters[code]) {
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
