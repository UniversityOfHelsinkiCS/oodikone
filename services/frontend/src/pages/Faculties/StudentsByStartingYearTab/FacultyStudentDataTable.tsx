import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
} from '@mui/icons-material'
import {
  Box,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { Fragment, useState } from 'react'

import { getCalendarYears } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { InfoBox } from '@/components/material/InfoBox'
import { PopulationLink } from '@/components/material/PopulationLink'
import { Section } from '@/components/material/Section'
import { DegreeProgramme } from '@/types/api/faculty'

const getTableCell = (year: string, programme: string, value: number | string) => {
  return (
    <TableCell key={`${year}-${programme}-color-${Math.random()}`} sx={{ textAlign: 'right' }}>
      {value}
    </TableCell>
  )
}

const getOtherCountriesList = ({
  year,
  code,
  extraTableStats,
}: {
  year: string
  code: string
  extraTableStats: Record<string, Record<string, Record<string, number>>>
}) => {
  const countriesData = extraTableStats?.[year]?.[code]
  if (!countriesData || Object.keys(countriesData).length === 0) {
    return null
  }

  return Object.keys(countriesData)
    .sort()
    .map(country => (
      <div key={country}>
        {country}: <b>{countriesData[country]}</b>
      </div>
    ))
}

const getRows = (
  extraTableStats: Record<string, Record<string, Record<string, number>>>,
  programme: string,
  programmeNames: Record<string, DegreeProgramme>,
  programmeStats: Record<string, Record<string, (number | string)[]>>,
  showPercentages: boolean,
  year: string
) => {
  return programmeStats[programme][year].map((value, valIndex) => {
    const key = `${programme}-${year}-${`${value}${valIndex}`}`
    if (!showPercentages && typeof value === 'string' && (value.includes('%') || value.includes('NA'))) return null
    const tableCell = getTableCell(year, programme, value)
    if (valIndex === 19) {
      const countriesPopupContent = getOtherCountriesList({
        year,
        code: programmeNames[programme].code,
        extraTableStats,
      })
      if (!countriesPopupContent) {
        return tableCell
      }
      return (
        <Tooltip key={key} title={countriesPopupContent}>
          {tableCell}
        </Tooltip>
      )
    }
    return tableCell
  })
}

export const FacultyStudentDataTable = ({
  extraTableStats,
  programmeNames,
  programmeStats,
  requiredRights,
  showPercentages,
  sortedKeys,
  tableStats,
  titles,
  years,
}: {
  extraTableStats: Record<string, Record<string, Record<string, number>>>
  programmeNames: Record<string, DegreeProgramme>
  programmeStats: Record<string, Record<string, (number | string)[]>>
  requiredRights: {
    fullAccessToStudentData: boolean
    programmeRights: string[]
  }
  showPercentages: boolean
  sortedKeys: string[]
  tableLinePlaces: string[][]
  tableStats: Record<string, (number | string)[]>
  titles: string[]
  years: string[]
}) => {
  const cypress = 'FacultyStudentStatsTable'
  const [yearsVisible, setVisible] = useState(new Array<boolean>(years.length).fill(false))
  const { getTextIn } = useLanguage()
  const toggleVisibility = (yearIndex: number) => {
    const arrayToModify = [...yearsVisible]
    arrayToModify[yearIndex] = !yearsVisible[yearIndex]
    setVisible(arrayToModify)
  }
  const infoText =
    "Hover over 'Other' cell to see from which countries students are coming. Shown only for study programmes."

  return (
    <Section>
      <TableContainer>
        <Table data-cy={cypress} sx={{ '& td': { whiteSpace: 'nowrap' } }}>
          <TableHead>
            <TableRow key="FirstHeader">
              <TableCell colSpan={!showPercentages ? 3 : 4} />
              <TableCell colSpan={!showPercentages ? 4 : 8}>Current status</TableCell>
              <TableCell colSpan={!showPercentages ? 3 : 6}>Gender</TableCell>
              <TableCell colSpan={!showPercentages ? 2 : 4}>
                <Stack direction="row" gap={1}>
                  Countries
                  <InfoBox content={infoText} mini />
                </Stack>
              </TableCell>
            </TableRow>
            <TableRow key="secondHeader">
              {titles.map((title, index) => (
                <TableCell
                  colSpan={[0, 1].includes(index) || !showPercentages ? 1 : 2}
                  key={title}
                  sx={{ textAlign: 'right' }}
                >
                  {title}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {years.map((year, yearIndex) => {
              return (
                <Fragment key={`${year}-fragment`}>
                  <TableRow key={`${year}-faculty-row}`}>
                    {tableStats[year]?.map((value, valueIndex) => {
                      if (valueIndex === 0)
                        return (
                          <TableCell key={`${year}-faculty-cell}`}>
                            <Box
                              alignItems="center"
                              data-cy={`Button-${cypress}-${yearIndex}`}
                              display="flex"
                              justifyContent="center"
                              key={`${year}-studentsTableButton}`}
                            >
                              <IconButton
                                data-cy={`${cypress}${yearIndex}`}
                                onClick={() => toggleVisibility(yearIndex)}
                                size="small"
                              >
                                {yearsVisible[yearIndex] ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                              </IconButton>
                              <Typography variant="body2">{value}</Typography>
                            </Box>
                          </TableCell>
                        )
                      if (
                        !showPercentages &&
                        typeof value === 'string' &&
                        (value.includes('%') || value.includes('NA'))
                      ) {
                        return null
                      }
                      return (
                        <TableCell
                          key={`${year}$-cell-colorless-${valueIndex + Math.random()}`}
                          sx={{ textAlign: 'right' }}
                        >
                          {value}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                  {yearsVisible[yearIndex] &&
                    sortedKeys.map(programme => {
                      return !programmeStats[programme][year] || programmeStats[programme][year].length === 0 ? null : (
                        <TableRow key={`${year}-regular-row-${programme}`}>
                          <TableCell key={`${year}-${programme}`} sx={{ paddingLeft: '50px', textAlign: 'left' }}>
                            <Stack alignItems="center" direction="row" gap={0.5}>
                              <Tooltip
                                title={`${programmeNames[programme].code} – ${getTextIn(programmeNames[programme].name)}`}
                              >
                                <b>{programmeNames[programme].progId}</b>
                              </Tooltip>
                              {requiredRights.programmeRights?.includes(programmeNames[programme].code) ||
                                (requiredRights.fullAccessToStudentData && (
                                  <PopulationLink
                                    studyProgramme={programmeNames[programme].code}
                                    year={year}
                                    years={getCalendarYears(years)}
                                  />
                                ))}
                            </Stack>
                          </TableCell>
                          {getRows(extraTableStats, programme, programmeNames, programmeStats, showPercentages, year)}
                        </TableRow>
                      )
                    })}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Section>
  )
}
