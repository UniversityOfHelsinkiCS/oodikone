import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'

import type { ColumnDef } from '@tanstack/react-table'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'

import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { TableHeaderWithTooltip } from '@/components/common/TableHeaderWithTooltip'
import { creditDateFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { handleClipboardCopy } from '@/components/OodiTable/utils'
import { useStatusNotification } from '@/components/StatusNotification/Context'
import { DateFormat } from '@/constants/date'
import { CheckIcon, ContentCopyIcon } from '@/theme'
import { formatDate } from '@/util/timeAndDate'
import { FormattedStudentData } from '.'
import { joinProgrammes } from './util'

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
  const creditDateFilterOptions = useFilterSelector(creditDateFilter.selectors.selectOptions())

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
            tooltipText="Programme associated with the attainment or enrollment. View **programme distribution** above for more details."
          />
        ),
        cell: cell => {
          const programmeName = cell.getValue()
          if (!programmeName) return null
          return (
            <Tooltip arrow title={programmeName}>
              <span style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden' }}>{programmeName}</span>
            </Tooltip>
          )
        },
      }),
      columnHelper.accessor('primaryProgramme', {
        maxSize: 340,
        header: _ => (
          <TableHeaderWithTooltip
            header="Primary degree programme"
            tooltipText="Programme associated with the most recently acquired active study right. Columns showing degree programme specific data (e.g. Started in programme or Credits in HOPS) refer to the programme displayed here."
          />
        ),
        cell: cell => {
          const programmeName = cell.getValue()
          if (!programmeName) return null
          return (
            <Tooltip arrow title={programmeName}>
              <span style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden' }}>{programmeName}</span>
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
            header="Before starting"
            tooltipText={`Credits and courses that
              1. are included in the primary study plan for the programme
              2. were either completed or transferred
              3. were attained before starting in the current programme
              `}
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
          <TableHeaderWithTooltip
            header="Start date in"
            tooltipText={`**University**: First degree-leading study right granted in the University  
             **Study right\\***: Study right associated with current programme  
             **Programme\\***: Start date in the current programme

             \\* if applicable`}
          />
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
            tooltipText={`Time passed since starting in the programme until graduation, excluding allowed absences (unlimited statutory and 2 non-statutory absences). Each unique calendar month increments the amount.

            **Example:**  
            from 31st of January to 1st of March = 3 months  
            from 1st of January to 30th of March = 3 months
            `}
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
        cell: cell => {
          const studyTrack = cell.getValue()
          if (!studyTrack) return null

          return <span style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden' }}>{studyTrack}</span>
        },
      }),

      columnHelper.accessor('option', {
        header: isMastersProgramme ? 'Bachelor' : 'Master',
        cell: cell => {
          const value = cell.getValue()
          if (!value) return null

          return (
            <Tooltip arrow title={value}>
              <span
                style={{
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {value}
              </span>
            </Tooltip>
          )
        },
      }),
      columnHelper.accessor('programmes', {
        header: _ => (
          <TableHeaderWithTooltip
            header={includePrimaryProgramme ? 'Degree programmes' : 'Other programmes'}
            tooltipText="If a student has more than one programme, hover your mouse on the cell to view the rest. They are also displayed in the exported Excel file."
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
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{transferSource}</span>
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
