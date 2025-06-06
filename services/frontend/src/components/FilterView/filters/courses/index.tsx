import { produce } from 'immer'
import { keyBy } from 'lodash'
import { FC } from 'react'
import { Dropdown, type DropdownProps } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import type { FilterContext } from '../../context'
import type { FilterTrayProps } from '../../FilterTray'
import { createFilter } from '../createFilter'
import { CourseCard } from './CourseCard'
import { FilterType } from './filterType'

type CourseStats = Record<string, any>

const CourseFilterCard: FC<{
  courseStats: CourseStats
  options: FilterTrayProps['options']
  onOptionsChange: FilterContext['precomputed']
}> = ({ courseStats, options, onOptionsChange }) => {
  const { courseFilters } = options ?? {}
  const { getTextIn } = useLanguage()

  const name = 'course-filter-card'
  const dropdownOptions = Object.values(courseStats)
    .filter(cs => !courseFilters[cs.course.code])
    .sort((a, b) => a.course.code.localeCompare(b.course.code))
    .map(cs => ({
      key: `course-filter-option-${cs.course.code}`,
      text: `${cs.course.code} - ${getTextIn(cs.course.name)}`,
      value: cs.course.code,
    }))

  const setCourseFilter = (code, type) =>
    onOptionsChange(
      produce(options ?? {}, draft => {
        if (type === null) {
          delete draft.courseFilters[code]
        } else {
          draft.courseFilters[code] = type
        }
      })
    )

  const onChange: NonNullable<DropdownProps['onChange']> = (_, { value }) => {
    setCourseFilter(value?.[0], FilterType.ALL)
  }

  return (
    <>
      <Dropdown
        button
        className="mini course-filter-selection"
        closeOnChange
        data-cy="courseFilter-course-dropdown"
        fluid
        multiple
        name={name}
        onChange={onChange}
        options={dropdownOptions}
        placeholder="Select course"
        search
        selection
        value={[]}
      />
      {Object.entries(courseFilters).map(([code]) => (
        <CourseCard
          course={courseStats[code]}
          filterType={courseFilters[code] ?? FilterType.ALL}
          key={`course-filter-selected-course-${code}`}
          onChange={type => setCourseFilter(code, type)}
        />
      ))}
    </>
  )
}

const createFilterFunc =
  key =>
  ({ studentNumber }, { students }) => {
    return Object.keys(students[key]).includes(studentNumber)
  }

const filterFunctions = {
  [FilterType.ALL]: createFilterFunc('all'),
  [FilterType.PASSED]: createFilterFunc('passed'),
  [FilterType.FAILED]: createFilterFunc('failed'),
  [FilterType.ENROLLED_NO_GRADE]: createFilterFunc('enrolledNoGrade'),
}

export const courseFilter = createFilter({
  key: 'Courses',

  defaultOptions: {
    courseFilters: {},
  },

  precompute: ({ args }) => keyBy(args.courses, 'course.code'),

  isActive: ({ courseFilters }) => Object.entries(courseFilters).length > 0,

  filter(student, { precomputed: courseMap, options }) {
    const { courseFilters = {} } = options ?? { courseFilters: null }

    return Object.entries(courseFilters).reduce((result, [code, filterType]) => {
      const stats = courseMap[code]
      return !!stats && result && filterFunctions[filterType as string](student, stats)
    }, true)
  },

  render: (props, { precomputed }) => <CourseFilterCard {...props} courseStats={precomputed} />,

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
    },
  },
})

export const { isCourseSelected } = courseFilter.selectors

export const { toggleCourseSelection } = courseFilter.actions
