import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'

import { filterToolTips } from '@/common/InfoToolTips'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import type { SemestersData } from '@/redux/semesters'
import { FilterTrayProps } from '../FilterTray'
import { createFilter } from './createFilter'

const STATUS_OPTIONS = [
  { key: 'enrl-status-present', text: 'Present', value: 1 },
  { key: 'enrl-status-absent', text: 'Absent', value: 2 },
  { key: 'enrl-status-inactive', text: 'Passive', value: 3 },
]

const EnrollmentStatusFilterCard = ({ args, options, onOptionsChange }: FilterTrayProps) => {
  const allSemesters = args.allSemesters as SemestersData['semesters']
  const name = 'enrollmentStatusFilter'
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
      text: getTextIn(name),
      value: semestercode,
    }))

  return (
    <Box className="card-content">
      <FormControl fullWidth>
        <InputLabel id={`${name}-status-select-label`}>Choose enrollment status</InputLabel>
        <Select
          data-cy={`${name}-status`}
          labelId={`${name}-status-select-label`}
          onChange={(event: SelectChangeEvent) => onOptionsChange({ ...options, status: event.target.value })}
          value={status}
        >
          {STATUS_OPTIONS.map(({ key, value, text }) => (
            <MenuItem key={key} value={value}>
              {text}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <InputLabel id={`${name}-semesters-select-label`}>Choose semesters</InputLabel>
        <Select
          data-cy={`${name}-semesters`}
          labelId={`${name}-semesters-select-label`}
          multiple
          onChange={(event: SelectChangeEvent<number[]>) =>
            onOptionsChange({ ...options, semesters: event.target.value })
          }
          renderValue={semestercodes => (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {semestercodes
                .map(value => semesterOptions.find(semester => semester.value === value)!)
                .map(({ key, text }) => {
                  return <Chip key={key} label={text} sx={{ my: 0.5 }} />
                })}
            </Box>
          )}
          value={semesters}
        >
          {semesterOptions.map(({ key, value, text }) => (
            <MenuItem key={key} value={value}>
              {text}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

export const enrollmentStatusFilter = createFilter({
  key: 'EnrollmentStatus',

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
          correctStudyRight.semesterEnrollments.find(
            ({ semester: enrollmentSemester }) => enrollmentSemester === semester
          )?.type === status
      )
    }

    const allEnrollments = studyRights.flatMap(studyRight => studyRight.semesterEnrollments).filter(Boolean)

    return semesters.every(semester => {
      // HACK: If enrollment info not found, return false. This may or may not be what we want?
      return allEnrollments
        .filter(({ semester: enrollmentSemester }) => enrollmentSemester === semester)
        .some(({ type }) => type === status)
    })
  },

  render: EnrollmentStatusFilterCard,
})
