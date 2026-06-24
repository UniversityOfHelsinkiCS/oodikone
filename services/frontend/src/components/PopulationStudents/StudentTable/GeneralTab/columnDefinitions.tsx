import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'

import type { ColumnDef } from '@tanstack/react-table'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'

import { populationStudentsToolTips } from '@/common/InfoToolTips'
import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { TableHeaderWithTooltip } from '@/components/common/TableHeaderWithTooltip'
import { creditDateFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { handleClipboardCopy } from '@/components/OodiTable/utils'
import { FormattedStudentData } from '@/components/PopulationStudents/StudentTable/GeneralTab'
import { joinProgrammes } from '@/components/PopulationStudents/StudentTable/GeneralTab/util'
import { useStatusNotification } from '@/components/StatusNotification/Context'
import { DateFormat } from '@/constants/date'
import { CheckIcon, ContentCopyIcon } from '@/theme'
import { formatDate } from '@/util/timeAndDate'

const columnHelper = createColumnHelper<FormattedStudentData>()

type GeneralTabColDefProps = {
  programme: string | undefined
  combinedProgramme: string | undefined
  isMastersProgramme: boolean
  includePrimaryProgramme: boolean
  year: string | undefined
}

export const useGetColumnDefinitions = ({
  programme,
  combinedProgramme,
  isMastersProgramme,
  includePrimaryProgramme,
  year,
}: GeneralTabColDefProps): ColumnDef<FormattedStudentData, any>[] => {
  const { getTextIn } = useLanguage()
  const { useFilterSelector } = useFilters()
  const { setStatusNotification, closeNotification } = useStatusNotification()
  const creditDateFilterOptions = useFilterSelector(creditDateFilter.selectors.selectOptions(undefined))

  return useMemo(
    () => [
      columnHelper.accessor('studentNumber', {
        header: ({ table }) => {
          const allStudentNumbers = table.getFilteredRowModel().rows.map(row => row.original.studentNumber)
          const copyText = `Copied ${allStudentNumbers.length} student numbers`
          return (
            <Stack direction="row" spacing={1} sx={{ verticalAlign: 'middle' }}>
              <Box sx={{ alignSelf: 'center' }}>Student number</Box>
              <Tooltip title="Copy all student numbers to clipboard">
                <IconButton
                  onClick={event =>
                    void handleClipboardCopy(
                      event,
                      allStudentNumbers,
                      copyText,
                      setStatusNotification,
                      closeNotification
                    )
                  }
                >
                  <ContentCopyIcon color="action" />
                </IconButton>
              </Tooltip>
            </Stack>
          )
        },
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
      columnHelper.accessor('associatedProgramme', {
        maxSize: 340,
        header: _ => (
          <TableHeaderWithTooltip
            header="Associated programme"
            tooltipText={populationStudentsToolTips.generalTab.associatedProgramme}
          />
        ),
        cell: cell => {
          const programmeName = cell.getValue()
          if (!programmeName) return null
          return (
            <Tooltip arrow title={programmeName}>
              <span>{programmeName}</span>
            </Tooltip>
          )
        },
      }),
      columnHelper.accessor('primaryProgramme', {
        maxSize: 340,
        header: _ => (
          <TableHeaderWithTooltip
            header="Primary degree programme"
            tooltipText={populationStudentsToolTips.generalTab.primaryProgramme}
          />
        ),
        cell: cell => {
          const programmeName = cell.getValue()
          if (!programmeName) return null
          return (
            <Tooltip arrow title={programmeName}>
              <span>{programmeName}</span>
            </Tooltip>
          )
        },
      }),
      columnHelper.accessor('programmeStatus', {
        header: _ => (
          <TableHeaderWithTooltip header="Status" tooltipText={populationStudentsToolTips.generalTab.programmeStatus} />
        ),
      }),
      columnHelper.accessor('email', { header: 'email' }),
      columnHelper.accessor('secondaryEmail', { header: 'secondary email' }),
      columnHelper.accessor('phoneNumber', { header: 'Phone number' }),
      columnHelper.group({
        header: 'Credits',
        enableSorting: false,
        columns: [
          columnHelper.accessor('creditsTotal', { header: 'Total' }),
          columnHelper.accessor('creditsHops', { header: 'In study plan' }),
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
              if (combinedProgramme === 'MH90_001') return 'In licentiate study plan'
              if (isMastersProgramme) return 'In Bachelor study plan'
              return 'In Master study plan'
            },
          }),
        ],
      }),
      columnHelper.group({
        id: 'beforeStarting',
        header: () => (
          <TableHeaderWithTooltip
            header={`Prior to ${isMastersProgramme ? 'master' : 'bachelor'}`}
            tooltipText={populationStudentsToolTips.generalTab.beforeStarting}
          />
        ),
        columns: [
          columnHelper.accessor('creditsBeforeStarting', {
            header: 'Credits',
          }),
          columnHelper.accessor('coursesBeforeStarting', {
            header: 'Courses',
          }),
        ],
      }),
      columnHelper.accessor('grade', { header: 'Grade' }),

      columnHelper.group({
        id: 'startDates',
        header: () => (
          <TableHeaderWithTooltip header="Start date" tooltipText={populationStudentsToolTips.generalTab.startDates} />
        ),
        columns: [
          columnHelper.accessor('startYearAtUniversity', { header: 'University' }),
          columnHelper.accessor('studyRightStart', { header: 'Study right' }),
          columnHelper.accessor('programmeStart', { header: 'Programme' }),
        ],
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

      columnHelper.accessor('studyTimeMonths', {
        header: _ => (
          <TableHeaderWithTooltip
            header="Study time in months"
            tooltipText={populationStudentsToolTips.generalTab.studyTimeMonths}
          />
        ),
      }),

      columnHelper.accessor('semesterEnrollments', {
        maxSize: Number.MAX_SAFE_INTEGER - 1, // MAGIC NUMBER; we want to fit all enrollments without size constraints
        header: 'Semesters present',
        cell: cell => {
          const content = cell.getValue()?.content
          if (!content) return null

          return (
            <Box sx={{ display: 'inline-flex' }}>
              {content.map(({ key, onHoverString, typeLabel, graduationCrown }) => (
                <Tooltip key={key} placement="top" title={onHoverString}>
                  <span className={`enrollment-label label-${typeLabel} ${graduationCrown}`} />
                </Tooltip>
              ))}
            </Box>
          )
        },
      }),

      columnHelper.accessor('studyTrack', {
        header: 'Study track',
      }),

      columnHelper.accessor('option', {
        header: isMastersProgramme ? 'Bachelor' : 'Master',
        cell: cell => {
          const value = cell.getValue()
          if (!value) return null

          return (
            <Tooltip arrow title={value}>
              <span>{value}</span>
            </Tooltip>
          )
        },
      }),
      columnHelper.accessor('programmes', {
        header: _ => (
          <TableHeaderWithTooltip
            header={includePrimaryProgramme ? 'Degree programmes' : 'Other programmes'}
            tooltipText={populationStudentsToolTips.generalTab.programmes}
          />
        ),
        cell: cell => {
          const { programmes } = cell.getValue() ?? { programmes: '' }
          if (!programmes || programmes.length === 0) return null

          const programmeName = getTextIn(programmes[0]?.name) ?? ''
          const tooltipProgrammeList = joinProgrammes(programmes, getTextIn, '\n')

          return (
            <Tooltip arrow title={tooltipProgrammeList}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <span
                  style={{
                    display: 'block',
                    flexGrow: '1',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {programmes.length > 1 ? programmeName : programmeName}
                </span>
                {programmes.length > 1 ? (
                  <span style={{ flexGrow: '0', paddingLeft: '0.25em' }}>+{programmes.length - 1}</span>
                ) : null}
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
          if (!transferSource) return null

          return (
            <Tooltip arrow title={transferSource}>
              <span>{transferSource}</span>
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
            tooltipText={populationStudentsToolTips.generalTab.mostRecentAttainment}
          />
        ),
      }),
      columnHelper.accessor('tvex', {
        header: _ => <TableHeaderWithTooltip header="TVEX" tooltipText={populationStudentsToolTips.generalTab.tvex} />,
        cell: cell => {
          const isTVEX = !!cell.getValue()
          if (!isTVEX) return null

          return (
            <span style={{ display: 'flex', justifyContent: 'center' }}>
              <CheckIcon />
            </span>
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
