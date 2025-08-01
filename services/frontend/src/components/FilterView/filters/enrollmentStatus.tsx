import Stack from '@mui/material/Stack'

import { filterToolTips } from '@/common/InfoToolTips'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import type { SemestersData } from '@/redux/semesters'
import { FilterTrayProps } from '../FilterTray'
import { FilterSelect } from './common/FilterSelect'
import { createFilter } from './createFilter'

const STATUS_OPTIONS = [
  { key: 'enrl-status-present', text: 'Present', value: 1 },
  { key: 'enrl-status-absent', text: 'Absent', value: 2 },
  { key: 'enrl-status-inactive', text: 'Passive', value: 3 },
]

const EnrollmentStatusFilterCard = ({ args, options, onOptionsChange }: FilterTrayProps) => {
  const allSemesters = args.allSemesters as SemestersData['semesters']
  const { getTextIn } = useLanguage()

  if (!Object.keys(allSemesters).length) {
    return null
  }

  const { semesters, status } = options

  const semesterOptions = Object.values(allSemesters)
    .filter(semester => new Date(semester.startdate) <= new Date())
    .sort((a, b) => b.semestercode - a.semestercode)
    .map(({ semestercode, name }) => ({
      key: `semester-option-${semestercode}`,
      text: getTextIn(name) ?? '',
      value: semestercode,
    }))

  return (
    <Stack gap={1}>
      <FilterSelect
        filterKey={`${enrollmentStatusFilter.key}-status`}
        label="Choose enrollment status"
        onChange={({ target }) => onOptionsChange({ ...options, status: target.value })}
        options={STATUS_OPTIONS}
        value={status}
      />
      <FilterSelect
        filterKey={`${enrollmentStatusFilter.key}-semester`}
        label="Choose semesters"
        multiple
        onChange={({ target }) => onOptionsChange({ ...options, semesters: target.value })}
        options={semesterOptions}
        value={semesters}
      />
    </Stack>
  )
}

export const enrollmentStatusFilter = createFilter({
  key: 'enrollmentStatusFilter',

  title: 'Enrollment status',

  info: filterToolTips.enrollmentStatus,
  defaultOptions: {
    status: '',
    semesters: [],
  },

  isActive: ({ status }) => !!status,

  filter({ studyRights }, { args, options }) {
    const { status, semesters } = options

    if (args.programme) {
      const correctStudyRight = studyRights.find(({ studyRightElements }) =>
        studyRightElements.some(({ code }) => code === args.programme)
      )

      return semesters.every(
        semester =>
          correctStudyRight?.semesterEnrollments?.find(
            ({ semester: enrollmentSemester }) => enrollmentSemester === semester
          )?.type === status
      )
    }

    const allEnrollments = studyRights
      .flatMap(studyRight => studyRight.semesterEnrollments)
      .filter(enrollment => enrollment !== null)

    return semesters.every(semester => {
      // HACK: If enrollment info not found, return false. This may or may not be what we want?
      return allEnrollments
        .filter(({ semester: enrollmentSemester }) => enrollmentSemester === semester)
        .some(({ type }) => type === status)
    })
  },

  render: EnrollmentStatusFilterCard,
})
