import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { ClearIcon } from '@/theme'
import { FilterSelect } from '../common/FilterSelect'
import { FilterType } from './filterType'

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
const getSubstitutionTooltip = (substitutions: string[]) => (
  <Typography fontSize="0.9rem" whiteSpace="pre-line">
    Included course substitutions:
    {substitutions.map(code => `\n${code}`)}
  </Typography>
)
export const CourseCard = ({
  course,
  filterType,
  onChange,
}: {
  course: any
  filterType: number
  onChange: (type: number | null) => any
}) => {
  const { getTextIn } = useLanguage()

  const dropdownOptions = Object.entries(filterTexts).map(([type, { key, label }]) => ({
    key,
    text: label,
    value: type,
  }))

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
          {course?.substitutions?.length ? (
            <Tooltip title={getSubstitutionTooltip(course.substitutions)}>
              <Typography sx={{ color: 'text.secondary' }}>
                {course?.code}... +{course?.substitutions?.length}
              </Typography>
            </Tooltip>
          ) : (
            <Typography sx={{ color: 'text.secondary' }}>{course?.code}</Typography>
          )}
        </Box>
        <ClearIcon
          data-cy={`courseFilter-${course?.code}-clear`}
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
        filterKey={`courseFilter-${course?.code}`}
        label="Select course"
        onChange={({ target }) => onChange(Number(target.value))}
        options={dropdownOptions}
        value={String(filterType)}
      />
    </Box>
  )
}
