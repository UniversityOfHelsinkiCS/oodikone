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
}
type Args = { courses: CourseStats[]; includeSubstitutions?: boolean }
type Precompute = {
  courses: Record<string, CourseStats>
  substitutedBy: Record<string, string[][]>
}

const CourseFilterCard = ({ options, onOptionsChange, precomputed }: FilterTrayProps<Options, Args, Precompute>) => {
  const courseStats = precomputed.courses

  const courseFilters = options?.courseFilters
  const { getTextIn } = useLanguage()

  const dropdownOptions = Object.values(courseStats)
    .filter(cs => !cs.isCustom && !courseFilters[cs.groupId])
    .sort((a, b) => getSortRank(b.code) - getSortRank(a.code))
    .map(cs => ({
      key: `courseFilter-option-${cs.groupId}`,
      text: `${cs.code} - ${getTextIn(cs.name)}`,
      value: cs.groupId,
    }))

  const setCourseFilter = (groupId: string, type: FTValue | null) => {
    const newOpts = structuredClone(options)
    if (type === null) delete newOpts.courseFilters[groupId]
    else newOpts.courseFilters[groupId] = type

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
      {Object.entries(courseFilters).map(([groupId, type]) => (
        <CourseCard
          course={courseStats[groupId]}
          courses={courseStats}
          filterType={type}
          key={`courseFilter-selected-course-${groupId}`}
          onChange={type => setCourseFilter(groupId, type as FTValue)}
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
  },

  precompute: ({ args }) => ({
    courses: Object.fromEntries(args.courses.map(course => [course.groupId, course])),
    substitutedBy: args.courses.reduce<Record<string, string[][]>>((acc, { groupId, substitutionGroups }) => {
      if (substitutionGroups?.length) acc[groupId] = [...substitutionGroups]
      return acc
    }, {}),
  }),

  isActive: ({ courseFilters }) => Object.keys(courseFilters).length > 0,

  filter(student: FormattedStudent, { args, options, precomputed }) {
    const { courses, enrollments } = student
    const passedCourseGroupIds = courses
      .filter(({ credittypecode }) => credittypecode !== CreditTypeCode.FAILED)
      .map(({ courseGroupId }) => courseGroupId)

    const courseGroupIds = courses.map(({ courseGroupId }) => courseGroupId)
    const enrollmentGroupIds = enrollments.map(({ courseGroupId }) => courseGroupId)

    for (const [mainGroupId, filterType] of Object.entries(options.courseFilters)) {
      let foundPassed = false
      let foundAttainment = false
      let foundEnrollment = false

      const includeSubstitutions = args.includeSubstitutions ?? true
      ;[[mainGroupId], ...(includeSubstitutions ? (precomputed.substitutedBy[mainGroupId] ?? []) : [])].forEach(
        group => {
          foundPassed = foundPassed ? true : group.every(groupId => passedCourseGroupIds.includes(groupId))
          foundAttainment = foundAttainment ? true : group.every(groupId => courseGroupIds.includes(groupId))
          foundEnrollment = foundEnrollment ? true : group.every(groupId => enrollmentGroupIds.includes(groupId))
        }
      )

      const matchesFilterType = {
        [FilterType.ALL]: foundEnrollment || foundAttainment,
        [FilterType.PASSED]: foundPassed,
        [FilterType.FAILED]: foundAttainment && !foundPassed,
        [FilterType.ENROLLED_NO_GRADE]: foundEnrollment && !foundAttainment,
      }

      if (!matchesFilterType[filterType]) return false
    }

    return true
  },

  render: CourseFilterCard,

  selectors: {
    // NOTE: Remember FilterType.ALL === 0 when checking if courseFilters[course] exists
    isCourseSelected: ({ courseFilters }, courseGroupId) =>
      Object.values(FilterType).includes(courseFilters[courseGroupId]),
  },

  actions: {
    toggleCourseSelection: (options, groupId: string) => {
      if (!Object.values(FilterType).includes(options.courseFilters[groupId])) {
        options.courseFilters[groupId] = FilterType.ALL
      } else {
        delete options.courseFilters[groupId]
      }

      return options
    },
  },
})

export const { isCourseSelected } = courseFilter.selectors

export const { toggleCourseSelection } = courseFilter.actions
