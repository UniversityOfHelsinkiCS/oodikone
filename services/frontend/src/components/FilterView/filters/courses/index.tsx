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
      produce(options, draft => {
        draft.courseFilters[code] = type
        if (type === null) delete draft.courseFilters[code]
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
          filterType={courseFilters[code]}
          key={`course-filter-selected-course-${code}`}
          onChange={type => setCourseFilter(code, type)}
        />
      ))}
    </>
  )
}

export const courseFilter = createFilter({
  key: 'Courses',

  title: 'Courses',

  defaultOptions: {
    courseFilters: {},
  },

  precompute: ({ args }) => keyBy(args.courses, 'course.code'),

  isActive: ({ courseFilters }) => Object.keys(courseFilters).length > 0,

  filter({ studentNumber }, { precomputed, options }) {
    const filterKeys = {
      [FilterType.ALL]: 'all',
      [FilterType.PASSED]: 'passed',
      [FilterType.FAILED]: 'failed',
      [FilterType.ENROLLED_NO_GRADE]: 'enrolledNoGrade',
    }

    for (const [code, filterType] of Object.entries(options.courseFilters)) {
      const { students = {} } = precomputed[code]
      const key = filterKeys[filterType as string]

      if (!students?.[key]?.includes(studentNumber)) return false
    }

    return true
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
