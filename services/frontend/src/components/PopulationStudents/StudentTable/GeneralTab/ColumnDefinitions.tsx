import { Tooltip, Typography } from '@mui/material'
import { type MRT_ColumnDef } from 'material-react-table'
import { useMemo } from 'react'
import { StudentInfoItem } from '@/components/material/StudentInfoItem'
import { TableHeaderWithTooltip } from '@/components/material/TableHeaderWithTooltip'
import { DynamicColumnTitles } from './GeneralTab'

export const useColumnDefinitions = (dynamicTitles: DynamicColumnTitles) => {
  return useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'studentNumber',
        header: 'Student number',
        Header: () => <Typography fontWeight="bold">Student number</Typography>,
        Cell: ({ cell }) => (
          <StudentInfoItem sisPersonId={cell.row.original.sisuID} studentNumber={cell.getValue<string>()} />
        ),
        filterFn: 'startsWith',
        enableClickToCopy: true,
      },
      {
        accessorKey: 'lastName',
        header: 'Last name',
      },
      {
        accessorKey: 'firstNames',
        header: 'Given names',
      },
      {
        accessorKey: 'email',
        header: 'Email',
        enableClickToCopy: true,
      },
      {
        accessorKey: 'phoneNumber',
        header: 'Phone number',
      },
      {
        accessorKey: 'primaryProgramme',
        header: 'Primary study programme',
        Header: (
          <TableHeaderWithTooltip
            header="Primary study programme"
            tooltipText="Programme associated with the most recently acquired active study right. Columns showing study programme specific data (e.g. Started in programme or Credits in HOPS) refer to the programme displayed here."
          />
        ),
        Cell: ({ cell }) => {
          const value = cell.getValue<string>()
          const formattedValue = value.length > 45 ? `${value.substring(0, 43)}...` : value
          return (
            <Tooltip arrow title={value}>
              <span>{formattedValue}</span>
            </Tooltip>
          )
        },
      },
      {
        accessorKey: 'creditsTotal',
        header: 'All credits',
      },
      {
        accessorKey: 'creditsHops',
        header: 'Credits in HOPS',
      },
      {
        accessorKey: 'creditsCombinedProg',
        header: `${dynamicTitles.creditsCombinedProg}`,
      },
      {
        accessorKey: 'creditsSince',
        header: `${dynamicTitles.creditsSince}`,
      },
      {
        accessorKey: 'grade',
        header: 'Grade',
      },
      {
        accessorKey: 'studyTrack',
        header: 'Study track',
      },
      {
        accessorKey: 'studyRightStart',
        header: 'Start of study right',
      },
      {
        accessorKey: 'programmeStart',
        header: 'Started in programme',
      },
      {
        accessorKey: 'option',
        header: `${dynamicTitles.option}`,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>()
          const formattedValue = value.length > 45 ? `${value.substring(0, 43)}...` : value
          return (
            <Tooltip arrow title={value}>
              <span>{formattedValue}</span>
            </Tooltip>
          )
        },
      },
      {
        accessorKey: 'semesterEnrollments',
        header: 'Semesters present',
        Cell: ({ cell }) => {
          // @ts-expect-error add typing
          const { content } = cell.getValue()
          return content ?? null
        },
      },
      {
        accessorKey: 'graduationDate',
        header: `${dynamicTitles.primaryEndDate}`,
      },
      {
        accessorKey: 'graduationDateCombinedProg',
        header: `${dynamicTitles.secondaryEndDate}`,
      },
      {
        accessorKey: 'startYearAtUniversity',
        header: 'Start year at uni',
      },
      {
        accessorKey: 'programmes',
        header: `${dynamicTitles.programmes}`,
        Header: (
          <TableHeaderWithTooltip
            header={dynamicTitles.programmes}
            tooltipText="If a student has more than one programme, hover your mouse on the cell to view the rest. They are also displayed in the exported Excel file."
          />
        ),
        Cell: ({ cell }) => {
          // @ts-expect-error add typing
          const { programmes, programmeList } = cell.getValue()
          if (programmes.length === 0) return null

          const formattedProgramme = programmes[0].length > 45 ? `${programmes[0].substring(0, 43)}...` : programmes[0]
          return (
            <Tooltip arrow title={<div style={{ whiteSpace: 'pre-line' }}>{programmeList}</div>}>
              <span>
                {programmes.length > 1 ? `${formattedProgramme} +${programmes.length - 1}` : `${formattedProgramme}`}
              </span>
            </Tooltip>
          )
        },
      },
      {
        accessorKey: 'attainmentDate',
        header: 'Attainment date',
      },
      {
        accessorKey: 'enrollmentDate',
        header: 'Enrollment date',
      },
      {
        accessorKey: 'language',
        header: 'Language',
      },
      {
        accessorKey: 'transferredFrom',
        header: 'Transferred from',
      },
      {
        accessorKey: 'admissionType',
        header: 'Admission type',
        Header: (
          <TableHeaderWithTooltip
            header="Admission type"
            tooltipText="Not available for study rights granted prior to 2020"
          />
        ),
      },
      {
        accessorKey: 'gender',
        header: 'Gender',
      },
      {
        accessorKey: 'citizenships',
        header: 'Citizenships',
      },
      {
        accessorKey: 'curriculumPeriod',
        header: 'Curriculum period',
      },
      {
        accessorKey: 'mostRecentAttainment',
        header: 'Latest attainment date',
        Header: (
          <TableHeaderWithTooltip
            header="Latest attainment date"
            tooltipText="Date of the most recent course completion that is included in the HOPS"
          />
        ),
      },
      {
        accessorKey: 'extent',
        header: 'Extent',
      },
      {
        accessorKey: 'tags',
        header: 'Tags',
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last updated at',
      },
    ],
    [dynamicTitles]
  )
}
