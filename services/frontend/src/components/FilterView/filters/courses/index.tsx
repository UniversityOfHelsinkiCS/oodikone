import { keyBy } from 'lodash'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import type { FilterTrayProps } from '../../FilterTray'
import { FilterSelect } from '../common/FilterSelect'
import { createFilter } from '../createFilter'
import { CourseCard } from './CourseCard'
import { FilterType } from './filterType'

type CourseStats = Record<string, any>

const CourseFilterCard = ({ precomputed, options, onOptionsChange }: FilterTrayProps) => {
  const courseStats: CourseStats = precomputed.courses

  const courseFilters: Record<string, keyof typeof FilterType> = options?.courseFilters
  const { getTextIn } = useLanguage()

  const dropdownOptions = Object.values(courseStats)
    .filter(cs => !courseFilters[cs.course.code])
    .sort((a, b) => a.course.code.localeCompare(b.course.code))
    .map(cs => ({
      key: `courseFilter-option-${cs.course.code}`,
      text: `${cs.course.code} - ${getTextIn(cs.course.name)}`,
      value: cs.course.code,
    }))

  const setCourseFilter = (code, type) => {
    const newOpts = structuredClone(options)
    newOpts.courseFilters[code] = type
    if (type === null) delete newOpts.courseFilters[code]

    onOptionsChange(newOpts)
  }

  return (
    <>
      <FilterSelect
        filterKey="courseFilter"
        label="Select course"
        onChange={({ target }) => setCourseFilter(target.value, FilterType.ALL)}
        options={dropdownOptions}
        value={''}
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
  },

  precompute: ({ args }) => {
    const substitutedBy = args.courses.reduce(
      (acc, { course }) => {
        const { code, substitutions } = course
        for (const original of substitutions) {
          acc[original] ??= []
          acc[original].push(code)
        }

        return acc
      },
      {} as Record<string, string[]>
    )

    return {
      courses: keyBy(args.courses, 'course.code'),
      substitutedBy,
    }
  },

  isActive: ({ courseFilters }) => Object.keys(courseFilters).length > 0,

  filter({ studentNumber }, { precomputed, options }) {
    const filterKeys = {
      [FilterType.ALL]: 'all',
      [FilterType.PASSED]: 'passed',
      [FilterType.FAILED]: 'failed',
      [FilterType.ENROLLED_NO_GRADE]: 'enrolledNoGrade',
    }

    for (const [code, filterType] of Object.entries(options.courseFilters)) {
      const found = [code, ...(precomputed.substitutedBy[code] ?? [])].some(course => {
        const students = precomputed.courses?.[course]?.students ?? {}
        const key = filterKeys[filterType as string]

        return students?.[key]?.includes(studentNumber)
      })

      if (!found) return false
    }

    return true
  },

  render: CourseFilterCard,

  selectors: {
    isCourseSelected: ({ courseFilters }, course) => !!courseFilters[course],
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
