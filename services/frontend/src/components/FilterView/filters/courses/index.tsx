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
  includeSubstitutions: boolean
  idToGroupIdMap: Record<string, string>
}
type Args = { courses: CourseStats[]; includeSubstitutions?: boolean; idToGroupIdMap: Record<string, string> }
type Precompute = any

const CourseFilterCard = ({ options, onOptionsChange }: FilterTrayProps<Options, Args, Precompute>) => {
  const courseStats = options.courses

  const courseFilters = options?.courseFilters
  const { getTextIn } = useLanguage()

  const dropdownOptions = Object.values(courseStats)
    .filter(cs => !courseFilters[cs.groupId])
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
    courses: {},
    substitutedBy: {},
    includeSubstitutions: true,
    idToGroupIdMap: {},
  },

  precompute: ({
    args,
    options,
  }: {
    args: Args
    options: {
      courses?: Record<string, CourseStats>
      substitutedBy?: Record<string, string[][]>
      includeSubstitutions?: boolean
      idToGroupIdMap?: Record<string, string>
    }
  }) => {
    const substitutedBy = args.courses.reduce<Record<string, string[][]>>((acc, course: CourseStats) => {
      const { groupId, substitutionGroups } = course
      if (substitutionGroups) {
        for (const group of substitutionGroups) {
          acc[groupId] ??= []
          acc[groupId].push(group)
        }
      }

      return acc
    }, {})

    /* option.courses maybe frozen even when it should be used only within the scope of createFilter factory. */ {
      delete options.courses
      options.courses = Object.fromEntries(args.courses.map(course => [course.groupId, course]))
    }

    options.includeSubstitutions = args.includeSubstitutions ?? true
    options.substitutedBy = substitutedBy
    options.idToGroupIdMap = args.idToGroupIdMap
  },

  isActive: ({ courseFilters }) => Object.keys(courseFilters).length > 0,

  filter(student: FormattedStudent, { options }) {
    const { courses, enrollments } = student
    const toGroupIds = (courseIds: string[]) => courseIds.map(id => options.idToGroupIdMap[id]).filter(Boolean)

    const passedCourseGroupIds = toGroupIds(
      courses
        .filter(({ credittypecode }) => credittypecode !== CreditTypeCode.FAILED)
        .map(({ course_id }) => course_id)
    )

    const courseGroupIds = toGroupIds(courses.map(({ course_id }) => course_id))
    const enrollmentGroupIds = toGroupIds(enrollments.map(({ course_id }) => course_id))

    for (const [mainGroupId, filterType] of Object.entries(options.courseFilters)) {
      let foundPassed = false
      let foundAttainment = false
      let foundEnrollment = false

      ;[
        [mainGroupId],
        ...(options.includeSubstitutions ? (options.substitutedBy?.[mainGroupId] ?? []) : []),
      ].forEach(group => {
        foundPassed = foundPassed ? true : group.every(groupId => passedCourseGroupIds.includes(groupId))
        foundAttainment = foundAttainment ? true : group.every(groupId => courseGroupIds.includes(groupId))
        foundEnrollment = foundEnrollment ? true : group.every(groupId => enrollmentGroupIds.includes(groupId))
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
    isCourseSelected: ({ courseFilters }, courseGroupId) => Object.values(FilterType).includes(courseFilters[courseGroupId]),
    selectedCourseName: ({ courses }, courseGroupIds) => courses[courseGroupIds[0]]?.name,
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
