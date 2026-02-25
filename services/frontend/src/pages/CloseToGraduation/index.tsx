import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { range } from 'lodash-es'
import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table'
import { useEffect, useMemo, useState } from 'react'

import { getEnrollmentTypeTextForExcel, isFall } from '@/common'
import { closeToGraduationToolTips } from '@/common/InfoToolTips'
import { ExportToExcelDialog } from '@/components/common/MRTExcelExport'
import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { TableHeaderWithTooltip } from '@/components/common/TableHeaderWithTooltip'
import { InfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { LoadingSection } from '@/components/Loading'
import { getSemestersPresentFunctions } from '@/components/PopulationStudents/StudentTable/GeneralTab/columnHelpers/semestersPresent'
import { DateFormat } from '@/constants/date'
import { useTitle } from '@/hooks/title'
import { useGetStudentsCloseToGraduationQuery } from '@/redux/closeToGraduation'
import { useGetSemestersQuery } from '@/redux/semesters'
import { CheckIcon } from '@/theme'
import { getDefaultMRTOptions } from '@/util/getDefaultMRTOptions'
import { reformatDate } from '@/util/timeAndDate'
import { getFullLanguage } from '@oodikone/shared/language'

const NUMBER_OF_DISPLAYED_SEMESTERS = 6

const CheckIconWithTitle = ({ visible, title }: { visible: boolean; title?: string }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center' }} title={title}>
    {visible ? <CheckIcon color="success" fontSize="small" /> : <Box sx={{ width: '20px', height: '20px' }} />}
  </Box>
)

export const CloseToGraduation = () => {
  useTitle('Students close to graduation')
  const { data: students, isFetching } = useGetStudentsCloseToGraduationQuery()
  const { data: semesterData } = useGetSemestersQuery()
  const { semesters: allSemesters, currentSemester } = semesterData ?? { semesters: {}, currentSemester: null }

  const [selectedTab, setSelectedTab] = useState(0)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportData, setExportData] = useState<Record<string, unknown>[]>([])
  const { getTextIn, language } = useLanguage()
  const { getSemesterEnrollmentsContent, getSemesterEnrollmentsVal } = useMemo(
    () =>
      getSemestersPresentFunctions({
        getTextIn,
        year: new Date().getFullYear() - Math.floor(NUMBER_OF_DISPLAYED_SEMESTERS / 2),
        programme: null,
        studentToSecondStudyrightEndMap: null,
        studentToStudyrightEndMap: null,
        semestersToAddToStart: null,
        semesters: semesterData,
      }),
    [allSemesters, getTextIn, students]
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

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'student.studentNumber',
        header: 'Student number',
        Cell: ({ cell }) => (
          <StudentInfoItem
            sisPersonId={cell.row.original.student.sis_person_id}
            studentNumber={cell.getValue<string>()}
          />
        ),
        filterFn: 'startsWith',
      },
      {
        accessorKey: 'student.name',
        header: 'Name',
        filterFn: 'startsWith',
      },
      {
        accessorKey: 'student.phoneNumber',
        header: 'Phone number',
      },
      {
        accessorKey: 'student.email',
        header: 'Email',
      },
      {
        accessorKey: 'student.secondaryEmail',
        header: 'Secondary email',
      },
      {
        accessorFn: row => getFullLanguage(row.student.preferredLanguage),
        id: 'preferredLanguage',
        header: 'Preferred language',
        filterVariant: 'multi-select',
      },
      {
        accessorFn: row => getTextIn(row.faculty),
        header: 'Faculty',
        id: 'faculty',
        filterVariant: 'multi-select',
      },
      {
        accessorFn: row => getTextIn(row.programme.name),
        header: 'Programme',
        id: 'programme',
        filterVariant: 'multi-select',
      },
      {
        accessorFn: row => getTextIn(row.programme.studyTrack),
        id: 'studyTrack',
        header: 'Study track',
        filterVariant: 'multi-select',
      },
      {
        accessorFn: row => new Date(row.studyright.startDate),
        id: 'startOfStudyRight',
        Cell: ({ cell }) => reformatDate(cell.getValue<Date>(), DateFormat.ISO_DATE),
        header: 'Start of study right',
        filterVariant: 'date-range',
      },
      {
        accessorFn: row => new Date(row.programme.startedAt),
        id: 'startedInProgramme',
        Cell: ({ cell }) => reformatDate(cell.getValue<Date>(), DateFormat.ISO_DATE),
        header: 'Started in programme',
        Header: (
          <TableHeaderWithTooltip
            header="Started in programme"
            tooltipText="For students with only a study right in the master’s programme, this date is the same as 'Start of study right'. For students with study rights in both the bachelor’s and master’s programmes, this date represents when they started in the master’s programme (i.e. one day after graduating from the bachelor’s programme)."
          />
        ),
        filterVariant: 'date-range',
      },
      {
        header: 'Completed credits – HOPS',
        accessorKey: 'credits.hops',
        filterVariant: 'range',
        muiTableBodyCellProps: {
          align: 'right',
        },
      },
      {
        header: 'Completed credits – Total',
        accessorKey: 'credits.all',
        filterVariant: 'range',
        muiTableBodyCellProps: {
          align: 'right',
        },
      },
      {
        header: 'BSc & MSc study right',
        accessorKey: 'studyright.isBaMa',
        filterVariant: 'checkbox',
        Cell: ({ cell }) => <CheckIconWithTitle visible={cell.getValue<boolean>()} />,
        Header: (
          <TableHeaderWithTooltip
            header="BSc & MSc study right"
            tooltipText="Indicates whether the student has been granted the study right to complete both a bachelor's and a master's degree."
          />
        ),
      },
      {
        header: 'Curriculum period',
        accessorKey: 'curriculumPeriod',
        filterVariant: 'multi-select',
        Header: (
          <TableHeaderWithTooltip
            header="Curriculum period"
            tooltipText="The curriculum period the student has chosen for their primary study plan"
          />
        ),
      },
      {
        header: 'Semester enrollments',
        accessorFn: row => getSemesterEnrollmentsVal(row.studyright),
        Cell: ({ row }) => {
          const content = getSemesterEnrollmentsContent(row.original.student, row.original.studyright)
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
        id: 'semesterEnrollments',
      },
      {
        header: 'Semesters absent',
        accessorKey: 'numberOfAbsentSemesters',
        filterVariant: 'range',
        Header: (
          <TableHeaderWithTooltip
            header="Semesters absent"
            tooltipText="The number of semesters the student has been absent (both statutory (*lakiperusteinen*) and non-statutory absences) during their study right. The current semester is included."
          />
        ),
        muiTableBodyCellProps: {
          align: 'right',
        },
      },
      {
        header: 'Semesters used',
        accessorKey: 'numberOfUsedSemesters',
        filterVariant: 'range',
        Header: (
          <TableHeaderWithTooltip
            header="Semesters used"
            tooltipText="The number of semesters the student has either been enrolled as present (*läsnäoleva*) or the enrollment was neglected (*laiminlyöty*) during their study right. The current semester is included."
          />
        ),
        muiTableBodyCellProps: {
          align: 'right',
        },
      },
      {
        header: 'Thesis completed',
        accessorFn: row => row.thesisInfo != null,
        id: 'thesisCompleted',
        filterVariant: 'checkbox',
        Cell: ({ cell, row }) => (
          <CheckIconWithTitle
            title={
              cell.getValue()
                ? [
                    `Attainment date: ${reformatDate(row.original.thesisInfo.attainmentDate, DateFormat.ISO_DATE)}`,
                    `Course code: ${row.original.thesisInfo.courseCode}`,
                    `Grade: ${row.original.thesisInfo.grade}`,
                  ].join('\n')
                : undefined
            }
            visible={cell.getValue<boolean>()}
          />
        ),
        Header: (
          <TableHeaderWithTooltip
            header="Thesis completed"
            tooltipText="The thesis attainment must be linked to the correct study right. You can see the attainment date, course code, and grade by hovering over the check mark."
          />
        ),
      },
      {
        header: 'Latest attainment date – HOPS',
        accessorFn: row => new Date(row.attainmentDates.latestHops),
        id: 'latestAttainmentDateHops',
        Cell: ({ cell }) => reformatDate(cell.getValue<Date>(), DateFormat.ISO_DATE),
        Header: (
          <TableHeaderWithTooltip
            header="Latest attainment date – HOPS"
            tooltipText="The date when the student last completed a course in their primary study plan"
          />
        ),
        filterVariant: 'date-range',
      },
      {
        header: 'Latest attainment date – Total',
        accessorFn: row => new Date(row.attainmentDates.latestTotal),
        id: 'latestAttainmentDateTotal',
        Cell: ({ cell }) => reformatDate(cell.getValue<Date>(), DateFormat.ISO_DATE),
        Header: (
          <TableHeaderWithTooltip
            header="Latest attainment date – Total"
            tooltipText="The date when the student last completed any course at the university"
          />
        ),
        filterVariant: 'date-range',
      },
      {
        header: 'Earliest attainment date – HOPS',
        accessorFn: row => new Date(row.attainmentDates.earliestHops),
        id: 'earlistAttainmentDateHops',
        Cell: ({ cell }) => reformatDate(cell.getValue<Date>(), DateFormat.ISO_DATE),
        Header: (
          <TableHeaderWithTooltip
            header="Earliest attainment date – HOPS"
            tooltipText="The date when the student first completed a course in their primary study plan"
          />
        ),
        filterVariant: 'date-range',
      },
      ...semestersToInclude.map(semester => ({
        id: getTextIn(allSemesters[`${semester}`]?.name)!,
        header: `Enrollment status – ${getTextIn(allSemesters[`${semester}`]?.name)}`,
        accessorFn: row => {
          if (!row.studyright.semesterEnrollments) {
            return 'Not enrolled'
          }
          const enrollment = row.studyright.semesterEnrollments.find(enrollment => enrollment.semester === semester)
          return getEnrollmentTypeTextForExcel(enrollment?.type, enrollment?.statutoryAbsence)
        },
        visibleInShowHideMenu: false,
      })),
    ],
    [getSemesterEnrollmentsContent, getSemesterEnrollmentsVal, getTextIn, allSemesters, semestersToInclude]
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
    const hiddenColumns: Record<string, boolean> = {}
    for (const column of columns) {
      if (column.visibleInShowHideMenu === false) {
        hiddenColumns[column.id ?? column.header] = false
      }
    }
    setColumnVisibility(prev => ({ ...prev, ...hiddenColumns }))
  }, [columns])

  const displayedData = (selectedTab === 0 ? students?.bachelor : students?.masterAndLicentiate) ?? []

  const muiFilterTextFieldProps = ({ column }) => {
    if (column.columnDef.filterVariant && ['multi-select', 'select', 'text'].includes(column.columnDef.filterVariant)) {
      let placeholder = ''
      switch (column.columnDef.header) {
        case 'Faculty':
          placeholder = 'Matemaattis-luonnontieteellinen tiedekunta'
          break
        case 'Programme':
          placeholder = 'Matemaattisten tieteiden kandiohjelma'
          break
        case 'Study track':
          placeholder = 'Matematiikka'
          break
        case 'Curriculum period':
          placeholder = '2023-2026'
          break
        case 'Student number':
          placeholder = '012345678'
          break
      }
      return { placeholder }
    }
    return {}
  }

  const defaultOptions = getDefaultMRTOptions(setExportData, setExportModalOpen, language)
  defaultOptions.muiFilterTextFieldProps = muiFilterTextFieldProps // Add "patched" filter-placeholders to MRT options

  const table = useMaterialReactTable({
    ...defaultOptions,
    columns,
    data: displayedData,
    initialState: {
      ...defaultOptions.initialState,
      sorting: [{ id: 'programme', desc: false }],
    },
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  })

  return (
    <PageLayout maxWidth="lg">
      <PageTitle title="Students close to graduation" />
      {!isFetching && (
        <ExportToExcelDialog
          exportColumns={columns}
          exportData={exportData}
          featureName="students_close_to_graduation"
          onClose={() => setExportModalOpen(false)}
          open={exportModalOpen}
        />
      )}

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

      {isFetching ? <LoadingSection /> : <MaterialReactTable key={selectedTab} table={table} />}
    </PageLayout>
  )
}
