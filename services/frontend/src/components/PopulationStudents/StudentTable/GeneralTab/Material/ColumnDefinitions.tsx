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
  'totalCredits',
  'studentNumber',
  'tags',
  'phoneNumber',
]

// Filter away unless user is an admin
export const adminColumns = ['priority', 'extent', 'updatedAt']

// Population specifics
export const columnsByVariant: Record<Variant, Set<string>> = {
  population: new Set(
    baseColumns.concat([
      'creditsSinceStart',
      'studyRightStart',
      'programmeStart',
      'master',
      'semestersPresent',
      'graduationDate',
      'startYearAtUniversity',
      'otherProgrammes',
      'transferredFrom',
      'admissionType',
      'gender',
      'citizenships',
      'curriculumPeriod',
      'mostRecentAttainment',
      'priority',
      'extent',
      'updatedAt',
    ])
  ),
}

export const useColumnDefinitions = () => {
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
        accessorKey: 'totalCredits',
        header: 'All',
      },
      {
        accessorKey: 'hopsCredits',
        header: 'HOPS',
      },
      {
        accessorKey: 'creditsSinceStart',
        header: 'Since start in programme',
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
        accessorKey: 'semestersPresent',
        header: 'Semesters present',
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
        accessorKey: 'priority',
        header: 'Priority',
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
    []
  )
}
