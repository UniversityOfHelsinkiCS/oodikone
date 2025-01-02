import { Done as DoneIcon, Remove as RemoveIcon } from '@mui/icons-material'
import { Box, Stack } from '@mui/material'
import { green, yellow, grey } from '@mui/material/colors'
import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { ExportToExcelDialog } from '@/components/material/ExportToExcelDialog'
import { RightsNotification } from '@/components/material/RightsNotification'
import { StudentInfoItem } from '@/components/material/StudentInfoItem'
import { StudentNameVisibilityToggle, useStudentNameVisibility } from '@/components/StudentNameVisibilityToggle'
import { ISO_DATE_FORMAT } from '@/constants/date'
import { useGetCompletedCoursesQuery } from '@/redux/completedCoursesSearch'
import { getDefaultMRTOptions } from '@/util/getDefaultMRTOptions'
import { isWithinSixMonths } from '@/util/timeAndDate'

const isPassed = credit => [4, 7, 9].includes(credit)

const getTotalPassed = student => student.credits.filter(credit => isPassed(credit.creditType)).length

const getTotalUnfinished = student => Object.values(student.enrollments).length

const getCompletion = (student, courseCode, { icon }) => {
  const completion = student.credits.find(credit => credit.courseCode === courseCode && isPassed(credit.creditType))
  const enrollment = student.enrollments[courseCode]
  if (completion === undefined) {
    if (!enrollment) {
      return null
    }
    if (icon) {
      if (isWithinSixMonths(enrollment.date)) {
        return <RemoveIcon fontSize="small" style={{ color: yellow[800] }} />
      }
      return <RemoveIcon fontSize="small" style={{ color: grey[700] }} />
    }

    return `Latest enrollment: ${moment(enrollment.date).format(ISO_DATE_FORMAT)}`
  }

  const substitutionString = completion.substitution ? ` as ${completion.substitution}` : ''

  return icon ? <DoneIcon fontSize="small" style={{ color: green[700] }} /> : `Passed${substitutionString}`
}

const getCellTitle = (student, courseCode) => {
  const credit = student.credits.find(credit => credit.courseCode === courseCode)
  const enrollment = student.enrollments[courseCode]
  if (!credit && !enrollment) {
    return ''
  }
  const title = credit
    ? `Passed on ${moment(credit.date).format(ISO_DATE_FORMAT)}\nCourse code: ${
        credit.substitution ? credit.substitution : credit.courseCode
      }`
    : `Last enrollment on ${moment(enrollment.date).format(ISO_DATE_FORMAT)}\nCourse code ${
        enrollment.substitution ? enrollment.substitution : enrollment.courseCode
      }`
  return title
}

export const SearchResults = ({ searchValues }) => {
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

  const staticColumns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
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
        accessorFn: student => getTotalPassed(student),
        id: 'passed',
        header: 'Passed',
      },
      {
        accessorFn: student => getTotalUnfinished(student),
        id: 'unfinished',
        header: 'Unfinished',
      },
    ],
    []
  )

  const dynamicColumns = useMemo(() => {
    if (!data || data.length === 0) return []
    return data.courses.map(course => ({
      accessorFn: student => getCompletion(student, course.code, { icon: false }),
      id: course.code,
      header: `${course.code} – ${getTextIn(course.name)}`,
      Header: () => (
        <Box>
          <Box>{course.code}</Box>
          <Box sx={{ color: 'text.secondary', fontWeight: 'normal' }}>{getTextIn(course.name)}</Box>
        </Box>
      ),
      Cell: ({ cell }) => (
        <Box sx={{ display: 'flex', justifyContent: 'center' }} title={getCellTitle(cell.row.original, course.code)}>
          {getCompletion(cell.row.original, course.code, { icon: true })}
        </Box>
      ),
    }))
  }, [data, getTextIn])

  const columns = useMemo(() => [...staticColumns, ...dynamicColumns], [staticColumns, dynamicColumns])

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
      {data?.discardedStudentNumbers?.length > 0 && (
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