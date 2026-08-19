import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { FilterSelect } from '@/components/FilterView/filters/common/FilterSelect'
import { FilterType } from '@/components/FilterView/filters/courses/filterType'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { ClearIcon } from '@/theme'
import { CourseStats } from '@oodikone/shared/routes/populations'

const filterTexts = {
  [FilterType.ALL]: {
    key: 'all',
    label: 'All',
  },
  [FilterType.PASSED]: {
    key: 'passed',
    label: 'Passed',
  },
  [FilterType.FAILED]: {
    key: 'failed',
    label: 'Failed',
  },
  [FilterType.ENROLLED_NO_GRADE]: {
    key: 'enrolledNoGrade',
    label: 'Enrolled, No Grade',
  },
}
const SubstitutionTooltip = ({ substitutionGroupCodes }: { substitutionGroupCodes: string[][] }) => (
  <Typography fontSize="0.9rem" whiteSpace="pre-line">
    {`Included equivalent courses:\n${substitutionGroupCodes.map(group => group.join(', ')).join('\n')}`}
  </Typography>
)
export const CourseCard = ({
  course,
  courses,
  filterType,
  onChange,
}: {
  course: CourseStats
  courses: Record<string, CourseStats>
  filterType: number
  onChange: (type: number | null) => any
}) => {
  const { getTextIn } = useLanguage()

  const dropdownOptions = Object.entries(filterTexts).map(([type, { key, label }]) => ({
    key,
    text: label,
    value: type,
  }))

  // Only substitute courses that some student in the current population acually has
  const substitutionGroupCodes = (course?.substitutionGroups ?? [])
    .map(group => group.map(groupId => courses[groupId]?.code).filter((code): code is string => Boolean(code)))
    .filter(group => group.length > 0)

  return (
    <Box
      sx={theme => ({
        my: 0.5,
        py: 1,
        px: 1.5,
        backgroundColor: theme.palette.grey[200],
        borderRadius: 1,
        '& .MuiSelect-select': { backgroundColor: theme.palette.grey[50] },
      })}
    >
      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ mb: 2 }}>
          <Typography>{getTextIn(course?.name)}</Typography>
          {substitutionGroupCodes.length ? (
            <Tooltip title={<SubstitutionTooltip substitutionGroupCodes={substitutionGroupCodes} />}>
              <Typography sx={{ color: 'text.secondary' }}>
                {course?.code}... +{substitutionGroupCodes.length}
              </Typography>
            </Tooltip>
          ) : (
            <Typography sx={{ color: 'text.secondary' }}>{course?.code}</Typography>
          )}
        </Box>
        <ClearIcon
          data-cy={`courseFilter-${course?.groupId}-clear`}
          onClick={() => onChange(null)}
          sx={{
            color: theme => theme.palette.error.dark,
            '&:hover': {
              color: theme => theme.palette.error.light,
            },
          }}
        />
      </Stack>
      <FilterSelect
        filterKey={`courseFilter-${course?.groupId}`}
        label="Select course"
        onChange={({ target }) => onChange(Number(target.value))}
        options={dropdownOptions}
        value={String(filterType)}
      />
    </Box>
  )
}
