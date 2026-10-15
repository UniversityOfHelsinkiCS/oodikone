import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import { SxProps, Theme } from '@mui/material/styles'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import { Fragment, ReactNode, useState } from 'react'

import { BasicCell } from '@/components/common/StartingYearStatsTable/BasicCell'
import { OtherCountriesCell } from '@/components/common/StartingYearStatsTable/OtherCountriesCell'
import { getCellKey, getRowKey, shouldBeHidden } from '@/components/common/StartingYearStatsTable/util'
import { StyledTable } from '@/components/common/StyledTable'
import { InfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'
import { KeyboardArrowDownIcon, KeyboardArrowRightIcon } from '@/theme'

type StatsTableRow = {
  key: string
  /** Content of the first cell, e.g. year or programme name with a population link */
  label: ReactNode
  /** Stats of the row without the label column */
  values: (string | number)[]
  /** Shown as a tooltip on the "Other" citizenship cell */
  otherCountries?: Record<string, number> | null
  sx?: SxProps<Theme>
}

export type StatsTableGroup = StatsTableRow & { children: StatsTableRow[] }

const getSpanValue = (combinedProgramme: boolean, index: number, showPercentages: boolean) => {
  if (combinedProgramme && showPercentages) return index + 2
  if (combinedProgramme) return index + 1
  return index
}

const ValueCells = ({ row, showPercentages }: { row: StatsTableRow; showPercentages: boolean }) => {
  return row.values.map((value, index) => {
    if (shouldBeHidden(showPercentages, value)) {
      return null
    }
    // The second to last value is the count of students from other countries
    if (index === row.values.length - 2) {
      return (
        <OtherCountriesCell
          countries={row.otherCountries}
          key={getCellKey(`${row.key}-other-country`, index)}
          value={value}
        />
      )
    }
    return <BasicCell key={getCellKey(`${row.key}-basic`, index)} value={value} />
  })
}

export const StartingYearStatsTable = ({
  citizenshipInfo = "Hover over 'Other' cell to see which citizenships (other than Finland) students have",
  combinedProgramme = false,
  cypress,
  groups,
  showPercentages,
  titles,
}: {
  citizenshipInfo?: string
  combinedProgramme?: boolean
  cypress: string
  groups: StatsTableGroup[]
  showPercentages: boolean
  titles: string[]
}) => {
  'use memo'
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <TableContainer>
      <StyledTable data-cy={cypress} showCellBorders slimBody>
        <TableHead>
          <TableRow>
            <TableCell colSpan={!showPercentages ? 3 : 4} />
            <TableCell
              colSpan={
                !showPercentages
                  ? getSpanValue(combinedProgramme, 6, showPercentages)
                  : getSpanValue(combinedProgramme, 12, showPercentages)
              }
            >
              Current status
            </TableCell>
            <TableCell colSpan={!showPercentages ? 3 : 6}>Gender</TableCell>
            <TableCell colSpan={!showPercentages ? 2 : 4}>
              <Stack alignItems="center" direction="row" gap={1}>
                Citizenships
                <InfoBox content={citizenshipInfo} mini />
              </Stack>
            </TableCell>
          </TableRow>
          <TableRow>
            {titles.map((title, index) => (
              <TableCell
                align="center"
                colSpan={index === 0 || index === 1 || !showPercentages ? 1 : 2}
                key={getRowKey(title, index)}
              >
                {title}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.map(group => (
            <Fragment key={getRowKey(group.key, 0)}>
              <TableRow sx={group.sx}>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Stack alignItems="center" direction="row">
                    {group.children.length > 0 && (
                      <IconButton
                        data-cy="show-study-tracks-button"
                        onClick={() => toggleGroup(group.key)}
                        size="small"
                      >
                        {expandedGroups[group.key] ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                      </IconButton>
                    )}
                    {group.label}
                  </Stack>
                </TableCell>
                <ValueCells row={group} showPercentages={showPercentages} />
              </TableRow>
              {expandedGroups[group.key]
                ? group.children.map(row => (
                    <TableRow key={getRowKey(`${group.key}-${row.key}`, 1)} sx={row.sx}>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {row.label}
                      </TableCell>
                      <ValueCells row={row} showPercentages={showPercentages} />
                    </TableRow>
                  ))
                : null}
            </Fragment>
          ))}
        </TableBody>
      </StyledTable>
    </TableContainer>
  )
}
