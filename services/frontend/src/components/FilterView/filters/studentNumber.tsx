import SwapVertIcon from '@mui/icons-material/SwapVert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { isEqual, union } from 'lodash'

import { filterToolTips } from '@/common/InfoToolTips'
import { formatToArray } from '@oodikone/shared/util'
import { FilterTrayProps } from '../FilterTray'
import { FilterSearchableSelect } from './common/FilterSearchableSelect'
import { createFilter } from './createFilter'

const StudentNumberFilterCard = ({ options, onOptionsChange, students }: FilterTrayProps) => {
  const dropdownOptions = students.map(({ studentNumber }) => ({
    key: studentNumber,
    text: studentNumber,
    value: studentNumber,
  }))

  return (
    <Stack gap={1}>
      <FilterSearchableSelect
        filterKey="studentNumberFilter-allowlist"
        label="Allowed student numbers"
        multiple
        onChange={studentNumbers => onOptionsChange({ ...options, allowlist: studentNumbers })}
        options={dropdownOptions}
        value={options.allowlist}
      />
      <Button
        onClick={() =>
          onOptionsChange({
            allowlist: options.blocklist,
            blocklist: options.allowlist,
          })
        }
        sx={{ width: '80%', m: 'auto' }}
        variant="outlined"
      >
        <Stack direction="row">
          <SwapVertIcon />
          <Typography>Swap lists</Typography>
        </Stack>
      </Button>
      <FilterSearchableSelect
        filterKey="studentNumberFilter-blocklist"
        label="Excluded student numbers"
        multiple
        onChange={studentNumbers => onOptionsChange({ ...options, blocklist: studentNumbers })}
        options={dropdownOptions}
        value={options.blocklist}
      />
    </Stack>
  )
}

export const studentNumberFilter = createFilter({
  key: 'studentNumber',

  title: 'Student number',

  defaultOptions: {
    allowlist: [],
    blocklist: [],
  },

  info: filterToolTips.studentNumber,

  isActive: ({ allowlist, blocklist }) => allowlist.length > 0 || blocklist.length > 0,

  filter(student, { options }) {
    const { allowlist, blocklist } = options

    return allowlist.includes(student.studentNumber) && !blocklist.includes(student.studentNumber)
  },

  render: StudentNumberFilterCard,

  actions: {
    addToAllowlist: (options, students) => ({
      allowlist: union(options.allowlist, formatToArray(students)),
      blocklist: options.blocklist,
    }),

    setAllowlist: (options, students) => ({
      allowlist: formatToArray(students),
      blocklist: options.blocklist,
    }),

    addToBlocklist: (options, students) => ({
      allowlist: options.allowlist,
      blocklist: union(options.blocklist, formatToArray(students)),
    }),

    setBlocklist: (options, students) => ({
      allowlist: options.allowlist,
      blocklist: formatToArray(students),
    }),
  },

  selectors: {
    studentListIsEqualToAllowlist: ({ allowlist }, students) => isEqual(allowlist, students),
  },
})
