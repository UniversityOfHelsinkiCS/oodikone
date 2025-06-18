import CheckIcon from '@mui/icons-material/Check'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { createMRTColumnHelper } from 'material-react-table'
import { useMemo } from 'react'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { StudentInfoItem } from '@/components/material/StudentInfoItem'
import { TableHeaderWithTooltip } from '@/components/material/TableHeaderWithTooltip'
import { muiTableBodyCellPropsDefaultSx } from '@/util/getDefaultMRTOptions'
import { FormattedStudentData } from '.'
import { DynamicColumnTitles } from './GeneralTab'
import { joinProgrammes } from './util'

export const useColumnDefinitions = (dynamicTitles: DynamicColumnTitles) => {
  const { getTextIn } = useLanguage()
  const columnHelper = createMRTColumnHelper<FormattedStudentData>()
  return useMemo(
    () => [
      columnHelper.accessor('studentNumber', {
        header: 'Student number',
        Header: () => <Typography fontWeight="bold">Student number</Typography>,
        Cell: ({ cell }) => {
          const studentNumber = cell.getValue()
          return studentNumber === 'Hidden' ? (
            'Hidden'
          ) : (
            <StudentInfoItem sisPersonId={cell.row.original.sisuID} studentNumber={studentNumber} />
          )
        },
        filterFn: 'startsWith',
        enableClickToCopy: true,
      }),
      columnHelper.accessor('lastName', {
        header: 'Last name',
      }),
      columnHelper.accessor('firstNames', {
        header: 'Given names',
      }),
      columnHelper.accessor('primaryProgramme', {
        header: 'Primary study programme',
        muiTableBodyCellProps: {
          sx: {
            ...muiTableBodyCellPropsDefaultSx,
            width: '250px',
            maxWidth: '340px',
          },
        },
        Header: (
          <TableHeaderWithTooltip
            header="Primary study programme"
            tooltipText="Programme associated with the most recently acquired active study right. Columns showing study programme specific data (e.g. Started in programme or Credits in HOPS) refer to the programme displayed here."
          />
        ),
        Cell: ({ cell }) => {
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
        header: 'Status',
        Header: (
          <TableHeaderWithTooltip
            header="Status"
            tooltipText="Shows the status of the current semester enrollment of the student in the corresponding programme."
          />
        ),
      }),
      columnHelper.accessor('creditsTotal', {
        header: 'All credits',
      }),
      columnHelper.accessor('creditsHops', {
        header: 'Credits in HOPS',
      }),
      columnHelper.accessor('creditsCombinedProg', {
        header: `${dynamicTitles.creditsCombinedProg}`,
      }),
      columnHelper.accessor('creditsSince', {
        header: `${dynamicTitles.creditsSince}`,
      }),
      columnHelper.accessor('grade', {
        header: 'Grade',
      }),
      columnHelper.accessor('studyTrack', {
        header: 'Study track',
      }),
      columnHelper.accessor('studyRightStart', {
        header: 'Start of study right',
      }),
      columnHelper.accessor('programmeStart', {
        header: 'Started in programme',
      }),
      columnHelper.accessor('option', {
        header: `${dynamicTitles.option}`,
        Cell: ({ cell }) => {
          const value = cell.getValue()
          const formattedValue = value.length > 45 ? `${value.substring(0, 43)}...` : value
          return (
            <Tooltip arrow title={value}>
              <span>{formattedValue}</span>
            </Tooltip>
          )
        },
      }),
      columnHelper.accessor('semesterEnrollments', {
        header: 'Semesters present',
        Cell: ({ cell }) => {
          const { content } = cell.getValue()
          return content ?? null
        },
      }),
      columnHelper.accessor('graduationDate', {
        header: `${dynamicTitles.primaryEndDate}`,
      }),
      columnHelper.accessor('graduationDateCombinedProg', {
        header: `${dynamicTitles.secondaryEndDate}`,
      }),
      columnHelper.accessor('startYearAtUniversity', {
        header: 'Start year at uni',
      }),
      columnHelper.accessor('programmes', {
        header: `${dynamicTitles.programmes}`,
        Header: (
          <TableHeaderWithTooltip
            header={dynamicTitles.programmes}
            tooltipText="If a student has more than one programme, hover your mouse on the cell to view the rest. They are also displayed in the exported Excel file."
          />
        ),
        Cell: ({ cell }) => {
          const { programmes } = cell.getValue()
          if (!programmes || programmes.length === 0) return null

          const programmeName = getTextIn(programmes[0].name) ?? ''
          const formattedProgramme = programmeName.length > 45 ? `${programmeName.substring(0, 43)}...` : programmeName
          const tooltipProgrammeList = joinProgrammes(programmes, getTextIn, '\n')

          return (
            <Tooltip arrow title={<div style={{ whiteSpace: 'pre-line' }}>{tooltipProgrammeList}</div>}>
              <span>
                {programmes.length > 1 ? `${formattedProgramme} +${programmes.length - 1}` : `${formattedProgramme}`}
              </span>
            </Tooltip>
          )
        },
      }),
      columnHelper.accessor('attainmentDate', {
        header: 'Attainment date',
      }),
      columnHelper.accessor('enrollmentDate', {
        header: 'Enrollment date',
      }),
      columnHelper.accessor('language', {
        header: 'Language',
      }),
      columnHelper.accessor('transferredFrom', {
        header: 'Transferred from',
      }),
      columnHelper.accessor('admissionType', {
        header: 'Admission type',
        Header: (
          <TableHeaderWithTooltip
            header="Admission type"
            tooltipText="Not available for study rights granted prior to 2020"
          />
        ),
      }),
      columnHelper.accessor('gender', {
        header: 'Gender',
      }),
      columnHelper.accessor('citizenships', {
        header: 'Citizenships',
      }),
      columnHelper.accessor('tvex', {
        header: 'TVEX',
        Header: (
          <TableHeaderWithTooltip
            header="TVEX"
            tooltipText="Student is enrolled to a bilingual programme (kaksikielinen tutkinto, tvåspråkig examen)"
          />
        ),
        Cell: ({ cell }) => {
          const isTVEX = cell.getValue()
          return (
            isTVEX && (
              <span style={{ display: 'flex', justifyContent: 'center' }}>
                <CheckIcon />
              </span>
            )
          )
        },
      }),
      columnHelper.accessor('curriculumPeriod', {
        header: 'Curriculum period',
      }),
      columnHelper.accessor('mostRecentAttainment', {
        header: 'Latest attainment date',
        Header: (
          <TableHeaderWithTooltip
            header="Latest attainment date"
            tooltipText="Date of the most recent course completion that is included in the HOPS"
          />
        ),
      }),
      columnHelper.accessor('extent', {
        header: 'Extent',
      }),
      columnHelper.accessor('tags', {
        header: 'Tags',
      }),
      columnHelper.accessor('updatedAt', {
        header: 'Last updated at',
      }),
    ],
    [dynamicTitles]
  )
}
