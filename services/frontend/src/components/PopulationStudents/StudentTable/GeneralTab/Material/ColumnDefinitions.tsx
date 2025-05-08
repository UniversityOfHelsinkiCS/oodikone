import { Tooltip, Typography } from '@mui/material'
import { type MRT_ColumnDef } from 'material-react-table'
import { useMemo } from 'react'
import { StudentInfoItem } from '@/components/material/StudentInfoItem'

export type Variant = 'population'

// Visible for each population, fallback for unknown variant
const baseColumns = [
  'lastName',
  'firstNames',
  'email',
  'credits',
  'creditsTotal',
  'studentNumber',
  'tags',
  'phoneNumber',
]

// Filter away unless user is an admin
export const adminColumns = ['extent', 'updatedAt']

// Population specifics
export const columnsByVariant: Record<Variant, Set<string>> = {
  population: new Set(
    baseColumns.concat([
      'creditsHops',
      'creditsSince',
      'studyTrack',
      'studyRightStart',
      'programmeStart',
      'master',
      'semesterEnrollments',
      'graduationDate',
      'startYearAtUniversity',
      'otherProgrammes',
      'transferredFrom',
      'admissionType',
      'gender',
      'citizenships',
      'curriculumPeriod',
      'mostRecentAttainment',
      'extent',
      'updatedAt',
    ])
  ),
}

export const useColumnDefinitions = (creditFilterText: string) => {
  return useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'studentNumber',
        header: 'Student number',
        Header: () => <Typography fontWeight="bold">Student number</Typography>,
        Cell: ({ cell }) => (
          <StudentInfoItem sisPersonId={cell.row.original.sis_person_id} studentNumber={cell.getValue<string>()} />
        ),
        filterFn: 'startsWith',
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
        accessorKey: 'creditsSince',
        header: `${creditFilterText}`,
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
        accessorKey: 'master',
        header: 'Master',
      },
      {
        accessorKey: 'semesterEnrollments',
        header: 'Semesters present',
        Cell: ({ cell }) => {
          // @ts-expect-error fix unknown type
          const { content } = cell.getValue()
          return content ?? null
        },
      },
      {
        accessorKey: 'graduationDate',
        header: 'Graduation date',
      },
      {
        accessorKey: 'startYearAtUniversity',
        header: 'Start year at uni',
      },
      {
        accessorKey: 'otherProgrammes',
        header: 'Other programmes',
        Cell: ({ cell }) => {
          // @ts-expect-error add typing
          const { programmes, programmeList } = cell.getValue()
          if (programmes.length === 0) return null

          const formattedProgramme = programmes[0].length > 45 ? `${programmes[0].substring(0, 43)}...` : programmes[0]
          return (
            <Tooltip arrow title={programmeList}>
              <span>
                {programmes.length > 1 ? `${formattedProgramme} +${programmes.length - 1}` : `${formattedProgramme}`}
              </span>
            </Tooltip>
          )
        },
      },
      {
        accessorKey: 'transferredFrom',
        header: 'Transferred from',
      },
      {
        accessorKey: 'admissionType',
        header: 'Admission type',
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
    [creditFilterText]
  )
}
