import CheckIcon from '@mui/icons-material/Check'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'

import type { ColumnDef } from '@tanstack/react-table'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'

import { creditDateFilter } from '@/components/FilterView/filters'
import { StudentInfoItem } from '@/components/material/StudentInfoItem'
import { TableHeaderWithTooltip } from '@/components/material/TableHeaderWithTooltip'

import { DateFormat } from '@/constants/date'
import { formatDate } from '@/util/timeAndDate'
import { FormattedStudentData } from '.'
import { joinProgrammes } from './util'

const columnHelper = createColumnHelper<FormattedStudentData>()

export const useGetColumnDefinitions = ({
  getTextIn,
  useFilterSelector,

  programme,
  combinedProgramme,
  isMastersProgramme,
  includePrimaryProgramme,
  year,
}): ColumnDef<FormattedStudentData, any>[] => {
  const creditDateFilterOptions = useFilterSelector(creditDateFilter.selectors.selectOptions())

  return useMemo(
    () => [
      columnHelper.accessor('studentNumber', {
        header: 'Student number',
        cell: cell => {
          const studentNumber = cell.getValue()
          if (studentNumber === 'Hidden') return studentNumber

          const { sisuID } = cell.row.original
          return <StudentInfoItem sisPersonId={sisuID} studentNumber={studentNumber} />
        },
        filterFn: 'includesString',
      }),
      columnHelper.accessor('firstNames', { header: 'First names' }),
      columnHelper.accessor('lastName', { header: 'Last name' }),
      columnHelper.accessor('primaryProgramme', {
        maxSize: 340,
        header: _ => (
          <TableHeaderWithTooltip
            header="Primary study programme"
            tooltipText="Programme associated with the most recently acquired active study right. Columns showing study programme specific data (e.g. Started in programme or Credits in HOPS) refer to the programme displayed here."
          />
        ),
        cell: cell => {
          const programmeName = cell.getValue()
          if (!programmeName) return null
          return (
            <Tooltip arrow title={programmeName}>
              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{programmeName}</span>
            </Tooltip>
          )
        },
      }),
      columnHelper.accessor('programmeStatus', {
        header: _ => (
          <TableHeaderWithTooltip
            header="Status"
            tooltipText="Shows the status of the studyright associated with the corresponding programme. Status is active only if an active semester enrollment for the ongoing semester exists."
          />
        ),
      }),
      columnHelper.accessor('email', { header: 'email' }),
      columnHelper.accessor('phoneNumber', { header: 'Phone number' }),
      columnHelper.group({
        header: 'Credits',
        enableSorting: false,
        columns: [
          columnHelper.accessor('creditsTotal', { header: 'Total' }),
          columnHelper.accessor('creditsHops', { header: 'In HOPS' }),
          columnHelper.accessor('creditsSince', {
            header: _ => {
              if (creditDateFilterOptions) {
                const { startDate, endDate } = creditDateFilterOptions

                if (startDate && endDate) {
                  return `Between ${formatDate(startDate, DateFormat.DISPLAY_DATE)} and ${formatDate(endDate, DateFormat.DISPLAY_DATE)}`
                } else if (startDate) {
                  return `Since ${formatDate(startDate, DateFormat.DISPLAY_DATE)}`
                } else if (year) {
                  if (endDate) {
                    return `Between 1.8.${year} and ${formatDate(endDate, DateFormat.DISPLAY_DATE)}`
                  } else {
                    return `Since 1.8.${year}`
                  }
                } else if (endDate) {
                  return `Before ${formatDate(endDate, DateFormat.DISPLAY_DATE)}`
                }
              }

              if (programme) return 'Since start in programme'
              return 'Since 1.1.1970'
            },
          }),
          columnHelper.accessor('creditsCombinedProg', {
            header: () => {
              if (combinedProgramme === 'MH90_001') return 'In licentiate HOPS'
              if (isMastersProgramme) return 'In Bachelor HOPS'
              return 'In Master HOPS'
            },
          }),
        ],
      }),
      columnHelper.accessor('grade', { header: 'Grade' }),
      columnHelper.accessor('studyTrack', { header: 'Study track' }),

      columnHelper.accessor('programmeStart', { header: 'Started in programme' }),
      columnHelper.accessor('studyRightStart', { header: 'Start of study right' }),
      columnHelper.accessor('startYearAtUniversity', { header: 'Start year at uni' }),

      columnHelper.accessor('semesterEnrollments', {
        header: 'Semesters present',
        cell: cell => {
          const { content } = cell.getValue()
          if (!content) return null

          return (
            <Box sx={{ display: 'flex', m: 0.5 }}>
              {content.map(({ key, onHoverString, typeLabel, graduationCrown }) => (
                <Tooltip key={key} placement="top" title={onHoverString}>
                  <span className={`enrollment-label label-${typeLabel} ${graduationCrown}`} />
                </Tooltip>
              ))}
            </Box>
          )
        },
      }),

      columnHelper.accessor('graduationDate', {
        header: combinedProgramme ? 'Bachelor graduation date' : 'Graduation date',
      }),
      columnHelper.accessor('graduationDateCombinedProg', {
        header: _ => {
          if (combinedProgramme === 'MH90_001') return 'Licentiate graduation date'
          if (isMastersProgramme) return 'Bachelor graduation date'
          return 'Master graduation date'
        },
      }),

      columnHelper.accessor('option', {
        header: isMastersProgramme ? 'Bachelor' : 'Master',
        cell: cell => {
          const value = cell.getValue() ?? ''

          return (
            <Tooltip arrow title={value}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
            </Tooltip>
          )
        },
      }),
      columnHelper.accessor('programmes', {
        header: _ => (
          <TableHeaderWithTooltip
            header={includePrimaryProgramme ? 'Study programmes' : 'Other programmes'}
            tooltipText="If a student has more than one programme, hover your mouse on the cell to view the rest. They are also displayed in the exported Excel file."
          />
        ),
        cell: cell => {
          const { programmes } = cell.getValue() ?? { programmes: '' }
          if (!programmes || programmes.length === 0) return null

          const programmeName = getTextIn(programmes[0]?.name) ?? ''
          const tooltipProgrammeList = joinProgrammes(programmes, getTextIn, '\n')

          return (
            <Tooltip arrow title={<div style={{ whiteSpace: 'pre-line' }}>{tooltipProgrammeList}</div>}>
              <div style={{ display: 'flex', width: '100%' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {programmes.length > 1 ? `${programmeName}...` : programmeName}
                </span>
                {programmes.length > 1 ? <span style={{ paddingLeft: '0.25em' }}>+{programmes.length - 1}</span> : null}
              </div>
            </Tooltip>
          )
        },
      }),
      columnHelper.accessor('attainmentDate', { header: 'Attainment date' }),
      columnHelper.accessor('enrollmentDate', { header: 'Enrollment date' }),
      columnHelper.accessor('language', { header: 'Language' }),
      columnHelper.accessor('transferredFrom', {
        header: 'Transferred From',
        cell: cell => {
          const transferSource = cell.getValue()
          return (
            <Tooltip arrow title={transferSource}>
              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{transferSource}</span>
            </Tooltip>
          )
        },
      }),
      columnHelper.accessor('admissionType', { header: 'Admission Type' }),
      columnHelper.accessor('gender', { header: 'Gender' }),
      columnHelper.accessor('citizenships', { header: 'Citizenships' }),
      columnHelper.accessor('curriculumPeriod', { header: 'Curriculum period' }),
      columnHelper.accessor('mostRecentAttainment', {
        header: _ => (
          <TableHeaderWithTooltip
            header="Latest attainment date"
            tooltipText="Date of the most recent course completion that is included in the HOPS"
          />
        ),
      }),
      columnHelper.accessor('tvex', {
        header: _ => (
          <TableHeaderWithTooltip
            header="TVEX"
            tooltipText="Student is enrolled to a bilingual programme (kaksikielinen tutkinto, tvåspråkig examen)"
          />
        ),
        cell: cell => {
          const isTVEX = !!cell.getValue()

          return (
            isTVEX && (
              <span style={{ display: 'flex', justifyContent: 'center' }}>
                <CheckIcon />
              </span>
            )
          )
        },
      }),
      columnHelper.accessor('tags', { header: 'Tags' }),
      columnHelper.accessor('extent', { header: 'Extent' }),
      columnHelper.accessor('updatedAt', { header: 'Last updated at' }),
    ],
    [getTextIn, useFilterSelector, programme, combinedProgramme, isMastersProgramme, includePrimaryProgramme, year]
  )
}
