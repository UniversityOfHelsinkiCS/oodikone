import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import green from '@mui/material/colors/green'
import grey from '@mui/material/colors/grey'
import yellow from '@mui/material/colors/yellow'
import Stack from '@mui/material/Stack'

import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table'
import { useEffect, useMemo, useState } from 'react'
import { ExportToExcelDialog } from '@/components/common/MRTExcelExport'
import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { StudentNameVisibilityToggle, useStudentNameVisibility } from '@/components/common/StudentNameVisibilityToggle'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DateFormat } from '@/constants/date'
import { SearchValues } from '@/pages/CompletedCoursesSearch'
import { useGetCompletedCoursesQuery } from '@/redux/completedCoursesSearch'
import { CropSquareIcon, DoneIcon, RemoveIcon } from '@/theme'
import { getDefaultMRTOptions } from '@/util/getDefaultMRTOptions'
import { formatDate, isWithinSixMonths } from '@/util/timeAndDate'
import { CompletedCoursesStudent, CreditTypeCode } from '@oodikone/shared/types'

const isPassed = (creditType: CreditTypeCode) =>
  [CreditTypeCode.PASSED, CreditTypeCode.APPROVED, CreditTypeCode.IMPROVED].includes(creditType)

const getCompletion = (student: CompletedCoursesStudent, courseCode: string, icon: boolean) => {
  const completion = student.credits.find(credit => credit.courseCode === courseCode && isPassed(credit.creditType))
  const enrollment = student.enrollments[courseCode]
  const isInStudyPlan = student.coursesInStudyPlan.includes(courseCode)

  if (!completion) {
    if (!enrollment) {
      if (isInStudyPlan) {
        return <CropSquareIcon fontSize="small" style={{ color: grey[500] }} />
      }
      return null
    }
    if (icon) {
      if (isWithinSixMonths(enrollment.date)) {
        return <RemoveIcon fontSize="small" style={{ color: yellow[800] }} />
      }
      return <RemoveIcon fontSize="small" style={{ color: grey[700] }} />
    }

    return `Latest enrollment: ${formatDate(enrollment.date, DateFormat.ISO_DATE)}`
  }

  const substituted = Array.isArray(completion.substitution) && !!completion.substitution.length
  const substitutionString = substituted ? ` as ${completion.substitution!.join(', ')}` : ''
  return icon ? (
    <DoneIcon fontSize="small" style={{ color: substituted ? grey[700] : green[700] }} />
  ) : (
    `Passed${substitutionString}`
  )
}

const getCellTitle = (student: CompletedCoursesStudent, courseCode: string) => {
  const credit = student.credits.find(credit => credit.courseCode === courseCode)
  const enrollment = student.enrollments[courseCode]
  if (!credit && !enrollment) {
    return 'Student has the course in their primary study plan'
  }
  let title: string
  if (credit) {
    const substitutionString = credit.substitution?.length ? `Substituted by: ${credit.substitution?.join(', ')}` : ''
    title = `Passed on ${formatDate(credit.date, DateFormat.ISO_DATE)}\n${substitutionString}`
  } else {
    const substitutionString = enrollment.substitution?.length
      ? `Substituted by: ${enrollment.substitution?.join(', ')}`
      : ''
    title = `Last enrollment on ${formatDate(enrollment.date, DateFormat.ISO_DATE)}\n${substitutionString}`
  }

  return title
}

const RightsNotification = ({ discardedStudentNumbers }: { discardedStudentNumbers: string[] }) => {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return null
  }

  return (
    <Alert data-cy="rights-notification" onClose={() => setVisible(false)} severity="error">
      <AlertTitle>Invalid or forbidden student numbers</AlertTitle>
      The information for the following students could not be displayed. This may be because the students do not exist
      or you do not have the necessary permissions to view their information:
      <ul>
        {[...new Set(discardedStudentNumbers)].sort().map(num => (
          <li key={num}>{num}</li>
        ))}
      </ul>
    </Alert>
  )
}

export const SearchResults = ({ searchValues }: { searchValues: SearchValues }) => {
  const { courseList, studentList } = searchValues
  const { visible: namesVisible } = useStudentNameVisibility()
  const { data, isFetching } = useGetCompletedCoursesQuery({ courseList, studentList })
  const { getTextIn, language } = useLanguage()
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportData, setExportData] = useState<Record<string, unknown>[]>([])

  const [columnVisibility, setColumnVisibility] = useState({})

  useEffect(() => {
    setColumnVisibility({
      lastname: namesVisible,
      firstnames: namesVisible,
      email: namesVisible,
    })
  }, [namesVisible])

  const staticColumns = useMemo<MRT_ColumnDef<CompletedCoursesStudent>[]>(() => {
    const getTotalPassed = (student: CompletedCoursesStudent) =>
      student.credits.filter(credit => isPassed(credit.creditType)).length
    const getTotalUnfinished = (student: CompletedCoursesStudent) =>
      (data?.courses?.length ?? 0) - student.credits.length
    return [
      {
        accessorKey: 'lastname',
        header: 'Last name',
      },
      {
        accessorKey: 'firstnames',
        header: 'First names',
      },
      {
        accessorKey: 'studentNumber',
        header: 'Student number',
        Cell: ({ cell }) => (
          <StudentInfoItem sisPersonId={cell.row.original.sis_person_id} studentNumber={cell.getValue<string>()} />
        ),
        filterFn: 'startsWith',
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        accessorFn: getTotalPassed,
        id: 'passed',
        header: 'Passed',
      },
      {
        accessorFn: getTotalUnfinished,
        id: 'unfinished',
        header: 'Unfinished',
      },
    ]
  }, [data])

  const dynamicColumns = useMemo<MRT_ColumnDef<CompletedCoursesStudent>[]>(() => {
    if (!data) return []
    const courseOrder = courseList ?? []

    return (
      data.courses
        .toSorted((a, b) => courseOrder.indexOf(a.code) - courseOrder.indexOf(b.code))
        .map(course => ({
          accessorFn: (student: CompletedCoursesStudent) => getCompletion(student, course.code, false),
          id: course.code,
          header: `${course.code} – ${getTextIn(course.name)}`,
          Header: () => (
            <Box>
              <Box>{course.code}</Box>
              <Box sx={{ color: 'text.secondary', fontWeight: 'normal' }}>{getTextIn(course.name)}</Box>
            </Box>
          ),
          Cell: ({ cell }) => (
            <Box
              sx={{ display: 'flex', justifyContent: 'center' }}
              title={getCellTitle(cell.row.original, course.code)}
            >
              {getCompletion(cell.row.original, course.code, true)}
            </Box>
          ),
        })) ?? []
    )
  }, [data, getTextIn])

  const columns: any[] /* MRT getting replaced anyway */ = useMemo(
    () => [...staticColumns, ...dynamicColumns],
    [staticColumns, dynamicColumns]
  )

  const defaultOptions = getDefaultMRTOptions(setExportData, setExportModalOpen, language)

  const table = useMaterialReactTable({
    ...defaultOptions,
    columns,
    data: data?.students ?? [],
    state: {
      columnVisibility,
      showLoadingOverlay: isFetching,
    },
    onColumnVisibilityChange: setColumnVisibility,
  })

  return (
    <Stack alignItems="center" spacing={1} sx={{ width: '100%' }}>
      <ExportToExcelDialog
        exportColumns={columns}
        exportData={exportData}
        featureName="completed_courses"
        onClose={() => setExportModalOpen(false)}
        open={exportModalOpen}
      />
      {!!data?.discardedStudentNumbers?.length && (
        <div style={{ width: '75%' }}>
          <RightsNotification discardedStudentNumbers={data.discardedStudentNumbers} />
        </div>
      )}
      <StudentNameVisibilityToggle />
      <div data-cy="completed-courses-table-div" style={{ width: '100%' }}>
        <MaterialReactTable table={table} />
      </div>
    </Stack>
  )
}
