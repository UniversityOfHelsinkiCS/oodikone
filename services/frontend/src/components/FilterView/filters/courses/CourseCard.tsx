import ClearIcon from '@mui/icons-material/Clear'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
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

export const CourseCard = ({
  course,
  filterType,
  onChange,
}: {
  course: any
  filterType: keyof typeof FilterType
  onChange: (type) => any
}) => {
  const { getTextIn } = useLanguage()

  const dropdownOptions = Object.entries(filterTexts).map(([type, { key, label }]) => ({
    key,
    text: label,
    value: type,
    disabled: !Object.keys(course?.students[key] ?? {}).length,
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
          <Typography>{getTextIn(course.course?.name)}</Typography>
          <Typography sx={{ color: 'text.secondary' }}>{course.course?.code}</Typography>
        </Box>
        <ClearIcon
          data-cy={`courseFilter-${course.course?.code}-clear`}
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
        filterKey={`courseFilter-${course.course?.code}`}
        label="Select course"
        onChange={({ target }) => onChange(target.value)}
        options={dropdownOptions}
        value={filterType}
      />
    </Box>
  )
}
