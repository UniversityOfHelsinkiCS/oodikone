import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'

import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { TableHeaderWithTooltip } from '@/components/common/TableHeaderWithTooltip'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DateFormat } from '@/constants/date'
import { getPreferredLanguage } from '@/pages/CloseToGraduation/Beta/filters'
import { CheckIconWithTitle } from '@/pages/CloseToGraduation/common'
import { reformatDate } from '@/util/timeAndDate'
import type { CloseToGraduationData } from '@oodikone/shared/routes/populations'

export const CONTACT_COLUMN_IDS = ['name', 'phoneNumber', 'email', 'secondaryEmail', 'preferredLanguage']

const columnHelper = createColumnHelper<CloseToGraduationData>()

const toDate = (date: Date | string | undefined) => (date ? new Date(date) : undefined)

const dateColumn = (
  id: string,
  header: string,
  tooltipText: string | null,
  getDate: (row: CloseToGraduationData) => Date | string | undefined
) =>
  columnHelper.accessor(row => toDate(getDate(row)), {
    id,
    header: tooltipText ? () => <TableHeaderWithTooltip header={header} tooltipText={tooltipText} /> : header,
    cell: cell => reformatDate(cell.getValue(), DateFormat.ISO_DATE),
    sortUndefined: 'last',
  })

export const useCloseToGraduationColumns = (): ColumnDef<CloseToGraduationData, any>[] => {
  const { getTextIn } = useLanguage()
  return useMemo(
    () => [
      columnHelper.accessor(row => row.student.studentNumber, {
        id: 'studentNumber',
        header: 'Student number',
        cell: cell => (
          <StudentInfoItem sisPersonId={cell.row.original.student.sis_person_id} studentNumber={cell.getValue()} />
        ),
      }),
      columnHelper.accessor(row => row.student.name, { id: 'name', header: 'Name' }),
      columnHelper.accessor(row => row.student.phoneNumber, { id: 'phoneNumber', header: 'Phone number' }),
      columnHelper.accessor(row => row.student.email, { id: 'email', header: 'Email' }),
      columnHelper.accessor(row => row.student.secondaryEmail, { id: 'secondaryEmail', header: 'Secondary email' }),
      columnHelper.accessor(row => getPreferredLanguage(row.student.preferredLanguage), {
        id: 'preferredLanguage',
        header: 'Preferred language',
      }),
      columnHelper.accessor(row => getTextIn(row.faculty) ?? '', { id: 'faculty', header: 'Faculty' }),
      columnHelper.accessor(row => getTextIn(row.programme.name) ?? '', { id: 'programme', header: 'Programme' }),
      columnHelper.accessor(row => getTextIn(row.programme.studyTrack) ?? '', {
        id: 'studyTrack',
        header: 'Study track',
      }),
      dateColumn('startOfStudyRight', 'Start of study right', null, row => row.studyright.startDate),
      dateColumn(
        'startedInProgramme',
        'Started in programme',
        "For students with only a study right in the master’s programme, this date is the same as 'Start of study right'. For students with study rights in both the bachelor’s and master’s programmes, this date represents when they started in the master’s programme (i.e. one day after graduating from the bachelor’s programme).",
        row => row.programme.startedAt
      ),
      columnHelper.accessor(row => row.credits.hops, { id: 'creditsHops', header: 'Completed credits – HOPS' }),
      columnHelper.accessor(row => row.credits.all, { id: 'creditsTotal', header: 'Completed credits – Total' }),
      columnHelper.accessor(row => row.studyright.isBaMa, {
        id: 'isBaMa',
        header: () => (
          <TableHeaderWithTooltip
            header="BSc & MSc study right"
            tooltipText="Indicates whether the student has been granted the study right to complete both a bachelor's and a master's degree."
          />
        ),
        cell: cell => <CheckIconWithTitle visible={cell.getValue()} />,
      }),
      columnHelper.accessor(row => row.curriculumPeriod ?? '', {
        id: 'curriculumPeriod',
        header: () => (
          <TableHeaderWithTooltip
            header="Curriculum period"
            tooltipText="The curriculum period the student has chosen for their primary study plan"
          />
        ),
      }),
      columnHelper.accessor(row => row.numberOfAbsentSemesters, {
        id: 'semestersAbsent',
        header: () => (
          <TableHeaderWithTooltip
            header="Semesters absent"
            tooltipText="The number of semesters the student has been absent (both statutory (*lakiperusteinen*) and non-statutory absences) during their study right. The current semester is included."
          />
        ),
      }),
      columnHelper.accessor(row => row.numberOfUsedSemesters, {
        id: 'semestersUsed',
        header: () => (
          <TableHeaderWithTooltip
            header="Semesters used"
            tooltipText="The number of semesters the student has either been enrolled as present (*läsnäoleva*) or the enrollment was neglected (*laiminlyöty*) during their study right. The current semester is included."
          />
        ),
      }),
      columnHelper.accessor(row => row.thesisInfo != null, {
        id: 'thesisCompleted',
        header: () => (
          <TableHeaderWithTooltip
            header="Thesis completed"
            tooltipText="The thesis attainment must be linked to the correct study right. You can see the attainment date, course code, and grade by hovering over the check mark."
          />
        ),
        cell: cell => {
          const { thesisInfo } = cell.row.original
          return (
            <CheckIconWithTitle
              title={
                thesisInfo
                  ? [
                      `Attainment date: ${reformatDate(thesisInfo.attainmentDate, DateFormat.ISO_DATE)}`,
                      `Course code: ${thesisInfo.courseCode}`,
                      `Grade: ${thesisInfo.grade}`,
                    ].join('\n')
                  : undefined
              }
              visible={cell.getValue()}
            />
          )
        },
      }),
      dateColumn(
        'latestAttainmentDateHops',
        'Latest attainment date – HOPS',
        'The date when the student last completed a course in their primary study plan',
        row => row.attainmentDates.latestHops
      ),
      dateColumn(
        'latestAttainmentDateTotal',
        'Latest attainment date – Total',
        'The date when the student last completed any course at the university',
        row => row.attainmentDates.latestTotal
      ),
      dateColumn(
        'earliestAttainmentDateHops',
        'Earliest attainment date – HOPS',
        'The date when the student first completed a course in their primary study plan',
        row => row.attainmentDates.earliestHops
      ),
    ],
    [getTextIn]
  )
}
