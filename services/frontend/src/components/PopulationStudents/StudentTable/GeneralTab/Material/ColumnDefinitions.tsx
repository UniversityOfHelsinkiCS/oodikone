import { Typography } from '@mui/material'
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
