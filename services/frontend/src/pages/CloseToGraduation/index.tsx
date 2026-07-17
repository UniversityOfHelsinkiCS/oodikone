import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { useEffect, useMemo, useState } from 'react'

import { getEnrollmentTypeTextForExcel, isFall } from '@/common'
import { closeToGraduationToolTips } from '@/common/InfoToolTips'
import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { TableHeaderWithTooltip } from '@/components/common/TableHeaderWithTooltip'
import { InfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { LoadingSection } from '@/components/Loading'
import { getSemestersPresentFunctions } from '@/components/PopulationComponents/Students/Table/GeneralTab/columnHelpers/semestersPresent'
import { DateFormat } from '@/constants/date'
import { useTitle } from '@/hooks/title'
import { useSemesters } from '@/hooks/useSemesters'
import { useGetStudentsCloseToGraduationQuery } from '@/redux/closeToGraduation'
import { CheckIcon } from '@/theme'
import { reformatDate } from '@/util/timeAndDate'
import { getFullLanguage, Language } from '@oodikone/shared/language'
import { range } from '@oodikone/shared/util'
import { OodiTable } from '@/components/OodiTable'
import { CloseToGraduationData } from '@oodikone/shared/routes/populations'
import { createColumnHelper, TableOptions } from '@tanstack/react-table'

const NUMBER_OF_DISPLAYED_SEMESTERS = 6

const CheckIconWithTitle = ({ visible, title }: { visible: boolean; title?: string }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center' }} title={title}>
    {visible ? <CheckIcon color="success" fontSize="small" /> : <Box sx={{ width: '20px', height: '20px' }} />}
  </Box>
)

const columnHelper = createColumnHelper<CloseToGraduationData>()

export const CloseToGraduation = () => {
  useTitle('Students close to graduation')
  const { data: students, isFetching } = useGetStudentsCloseToGraduationQuery()
  const semesterData = useSemesters()
  const { semesters, currentSemester } = semesterData

  const [selectedTab, setSelectedTab] = useState(0)
  const { getTextIn } = useLanguage()
  const { getSemesterEnrollmentsContent, getSemesterEnrollmentsVal } = useMemo(
    () =>
      getSemestersPresentFunctions({
        getTextIn,
        year: new Date().getFullYear() - Math.floor(NUMBER_OF_DISPLAYED_SEMESTERS / 2),
        programme: null,
        semestersToAddToStart: null,
        semesters: semesterData,
      }),
    [semesters, getTextIn, students]
  )
  const currentSemesterCode = currentSemester?.semestercode
  const semestersToInclude = useMemo(
    () =>
      currentSemesterCode != null
        ? range(
            isFall(currentSemesterCode)
              ? currentSemesterCode - NUMBER_OF_DISPLAYED_SEMESTERS + 2
              : currentSemesterCode - NUMBER_OF_DISPLAYED_SEMESTERS + 1,
            isFall(currentSemesterCode) ? currentSemesterCode + 2 : currentSemesterCode + 1
          )
        : [],
    [currentSemesterCode]
  )

  const ooditableColumns = useMemo(
    () => [
      columnHelper.accessor('student.studentNumber', {
        header: 'Student number',
        cell: cell => (
          <StudentInfoItem
            sisPersonId={cell.row.original.student.sis_person_id}
            studentNumber={cell.getValue<string>()}
          />
        ),
        // filterFn: 'startsWith',
      }),
      columnHelper.accessor('student.name', {
        header: 'Name',
        // filterFn: 'startsWith',
      }),
      columnHelper.accessor('student.phoneNumber', {
        header: 'Phone number',
      }),
      columnHelper.accessor('student.email', {
        header: 'Email',
      }),
      columnHelper.accessor('student.secondaryEmail', {
        header: 'Secondary email',
      }),
      columnHelper.accessor(row => getFullLanguage(row.student.preferredLanguage as Language), {
        id: 'preferredLanguage',
        header: 'Preferred language',
        // filterVariant: 'multi-select',
      }),
      columnHelper.accessor(row => getTextIn(row.faculty), {
        header: 'Faculty',
        id: 'faculty',
        // filterVariant: 'multi-select',
      }),
      columnHelper.accessor(row => getTextIn(row.programme.name), {
        header: 'Programme',
        id: 'programme',
        // filterVariant: 'multi-select',
      }),
      columnHelper.accessor(row => getTextIn(row.programme.studyTrack), {
        id: 'studyTrack',
        header: 'Study track',
        // filterVariant: 'multi-select',
      }),
      columnHelper.accessor(row => new Date(row.studyright.startDate), {
        id: 'startOfStudyRight',
        cell: ({ cell }) => reformatDate(cell.getValue<Date>(), DateFormat.ISO_DATE),
        header: 'Start of study right',
        // filterVariant: 'date-range',
      }),
      columnHelper.accessor(row => new Date(row.programme.startedAt), {
        id: 'startedInProgramme',
        cell: cell => reformatDate(cell.getValue<Date>(), DateFormat.ISO_DATE),
        header: () => (
          <TableHeaderWithTooltip
            header="Started in programme"
            tooltipText="For students with only a study right in the master’s programme, this date is the same as 'Start of study right'. For students with study rights in both the bachelor’s and master’s programmes, this date represents when they started in the master’s programme (i.e. one day after graduating from the bachelor’s programme)."
          />
        ),
        // filterVariant: 'date-range',
      }),
      columnHelper.accessor('credits.hops', {
        header: 'Completed credits – HOPS',
        // accessorKey: 'credits.hops',
        // filterVariant: 'range',
        // muiTableBodyCellProps: {
        //   align: 'right',
        // },
      }),
      columnHelper.accessor('credits.all', {
        header: 'Completed credits – Total',
        // accessorKey: 'credits.all',
        // filterVariant: 'range',
        // muiTableBodyCellProps: {
        //   align: 'right',
        // },
      }),
      columnHelper.accessor('studyright.isBaMa', {
        // accessorKey: 'studyright.isBaMa',
        // filterVariant: 'checkbox',
        cell: cell => <CheckIconWithTitle visible={cell.getValue<boolean>()} />,
        header: () => (
          <TableHeaderWithTooltip
            header="BSc & MSc study right"
            tooltipText="Indicates whether the student has been granted the study right to complete both a bachelor's and a master's degree."
          />
        ),
      }),
      columnHelper.accessor('curriculumPeriod', {
        // accessorKey: 'curriculumPeriod',
        // filterVariant: 'multi-select',
        header: () => (
          <TableHeaderWithTooltip
            header="Curriculum period"
            tooltipText="The curriculum period the student has chosen for their primary study plan"
          />
        ),
      }),
      columnHelper.accessor(row => getSemesterEnrollmentsVal(row.studyright), {
        header: 'Semester enrollments',
        cell: cell => {
          const content = getSemesterEnrollmentsContent(cell.row.original.student, cell.row.original.studyright)

          return (
            <Box sx={{ display: 'flex', m: 0.5 }}>
              {content?.map(({ key, onHoverString, typeLabel, graduationCrown }) => (
                <Tooltip key={key} placement="top" title={onHoverString}>
                  <span className={`enrollment-label label-${typeLabel} ${graduationCrown}`} />
                </Tooltip>
              ))}
            </Box>
          )
        },
        id: 'semesterEnrollments',
      }),
      columnHelper.accessor('numberOfAbsentSemesters', {
        // accessorKey: 'numberOfAbsentSemesters',
        // filterVariant: 'range',
        header: () => (
          <TableHeaderWithTooltip
            header="Semesters absent"
            tooltipText="The number of semesters the student has been absent (both statutory (*lakiperusteinen*) and non-statutory absences) during their study right. The current semester is included."
          />
        ),
        // muiTableBodyCellProps: {
        //   align: 'right',
        // },
      }),
      columnHelper.accessor('numberOfUsedSemesters', {
        // accessorKey: 'numberOfUsedSemesters',
        // filterVariant: 'range',
        header: () => (
          <TableHeaderWithTooltip
            header="Semesters used"
            tooltipText="The number of semesters the student has either been enrolled as present (*läsnäoleva*) or the enrollment was neglected (*laiminlyöty*) during their study right. The current semester is included."
          />
        ),
        // muiTableBodyCellProps: {
        //   align: 'right',
        // },
      }),
      columnHelper.accessor(row => row.thesisInfo != null, {
        id: 'thesisCompleted',
        // filterVariant: 'checkbox',
        cell: cell => (
          <CheckIconWithTitle
            title={
              cell.getValue()
                ? [
                    `Attainment date: ${reformatDate(cell.row.original.thesisInfo?.attainmentDate, DateFormat.ISO_DATE)}`,
                    `Course code: ${cell.row.original.thesisInfo?.courseCode}`,
                    `Grade: ${cell.row.original.thesisInfo?.grade}`,
                  ].join('\n')
                : undefined
            }
            visible={cell.getValue<boolean>()}
          />
        ),
        header: () => (
          <TableHeaderWithTooltip
            header="Thesis completed"
            tooltipText="The thesis attainment must be linked to the correct study right. You can see the attainment date, course code, and grade by hovering over the check mark."
          />
        ),
      }),
      columnHelper.accessor(row => new Date(row.attainmentDates.latestHops), {
        id: 'latestAttainmentDateHops',
        cell: cell => reformatDate(cell.getValue<Date>(), DateFormat.ISO_DATE),
        header: () => (
          <TableHeaderWithTooltip
            header="Latest attainment date – HOPS"
            tooltipText="The date when the student last completed a course in their primary study plan"
          />
        ),
        // filterVariant: 'date-range',
      }),
      columnHelper.accessor(row => new Date(row.attainmentDates.latestTotal), {
        id: 'latestAttainmentDateTotal',
        cell: cell => reformatDate(cell.getValue<Date>(), DateFormat.ISO_DATE),
        header: () => (
          <TableHeaderWithTooltip
            header="Latest attainment date – Total"
            tooltipText="The date when the student last completed any course at the university"
          />
        ),
        // filterVariant: 'date-range',
      }),
      columnHelper.accessor(row => new Date(row.attainmentDates.earliestHops), {
        id: 'earlistAttainmentDateHops',
        cell: cell => reformatDate(cell.getValue<Date>(), DateFormat.ISO_DATE),
        header: () => (
          <TableHeaderWithTooltip
            header="Earliest attainment date – HOPS"
            tooltipText="The date when the student first completed a course in their primary study plan"
          />
        ),
        // filterVariant: 'date-range',
      }),
      ...semestersToInclude.map(semester => columnHelper.accessor(row => {
          if (!row.studyright.semesterEnrollments) {
            return 'Not enrolled'
          }
          const enrollment = row.studyright.semesterEnrollments.find(enrollment => enrollment.semester === semester)
          return getEnrollmentTypeTextForExcel(enrollment?.type, enrollment?.statutoryAbsence)
        }, {
        id: `enrollmentFor${getTextIn(semesters[`${semester}`]?.name)!}`,
        header: `Enrollment status – ${getTextIn(semesters[`${semester}`]?.name)}`,
      })),
    ],
    [semesters, semestersToInclude]
  )

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    'student.name': false,
    'student.phoneNumber': false,
    'student.email': false,
    'student.secondaryEmail': false,
    preferredLanguage: false,
    semesterEnrollments: false,
  })

  useEffect(() => {
    const hiddenColumns: string[] = []
    for (const column of ooditableColumns) {
      if (column.id?.startsWith('enrollmentFor')) hiddenColumns.push(column.id ?? column.header)
    }

    setColumnVisibility(prev => ({ ...prev, ...Object.fromEntries(hiddenColumns.map(key => [key, false])) }))
  }, [ooditableColumns])

  const displayedData = (selectedTab === 0 ? students?.bachelor : students?.masterAndLicentiate) ?? []

  const ooditable: Partial<TableOptions<CloseToGraduationData>> = {
    initialState: {
      sorting: [{ id: 'programme', desc: false }],
    },
    state: {
      columnVisibility,
    },
  }

  return (
    <PageLayout maxWidth="lg">
      <PageTitle title="Students close to graduation" />
      <Box sx={{ my: 3, textAlign: 'center' }}>
        <InfoBox content={closeToGraduationToolTips} />
      </Box>
      <Tabs centered onChange={(_event, value) => setSelectedTab(value)} value={selectedTab}>
        <Tab label="Bachelor's programmes" />
        <Tab label="Master's and licentiate's programmes" />
      </Tabs>
      <Box sx={{ minHeight: '1.25rem' }}>
        {students?.lastUpdated ? (
          <Typography color="text.secondary" variant="body2">
            Last updated: {reformatDate(students.lastUpdated, DateFormat.LONG_DATE_TIME)}
          </Typography>
        ) : null}
      </Box>

      {isFetching ? <LoadingSection /> : <OodiTable options={ooditable} data={displayedData} columns={ooditableColumns} />}
    </PageLayout>
  )
}
