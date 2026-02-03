import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Loading } from '@/components/Loading'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { DateFormat } from '@/constants/date'
import { useGetOpenUniCourseStudentsQuery } from '@/redux/openUniPopulations'
import { CheckIcon, CloseIcon, RemoveIcon } from '@/theme'
import { formatDate } from '@/util/timeAndDate'

const columnHelper = createColumnHelper()

const getTableData = studentsData => {
  return Object.keys(studentsData).reduce(
    (acc, student) => [
      ...acc,
      {
        studentnumber: student,
        courseInfo: { ...studentsData[student].courseInfo },
        email: studentsData[student].email,
        secondaryEmail: studentsData[student].secondaryEmail,
        totals: studentsData[student].totals,
      },
    ],
    []
  )
}

const findRowContent = (student, courseCode) => {
  if (student.courseInfo[courseCode] === undefined) return null
  if (student.courseInfo[courseCode].status.passed) return <CheckIcon color="success" />
  if (student.courseInfo[courseCode].status.failed) return <CloseIcon color="error" />
  if (student.courseInfo[courseCode].status.unfinished) return <RemoveIcon color="disabled" />
  return null
}

const findRowValue = (student, courseCode) => {
  if (student.courseInfo[courseCode]?.status.passed) {
    return `Passed: ${formatDate(student.courseInfo[courseCode].status.passed, DateFormat.ISO_DATE)}`
  }
  if (student.courseInfo[courseCode]?.status.failed) {
    return `Failed: ${formatDate(student.courseInfo[courseCode].status.failed, DateFormat.ISO_DATE)}`
  }
  if (student.courseInfo[courseCode]?.status.unfinished) {
    return `Enrollment: ${formatDate(student.courseInfo[courseCode].status.unfinished, DateFormat.ISO_DATE)}`
  }

  return ''
}

const getColumns = (labelsToCourses, getTextIn) => [
  columnHelper.group({
    key: 'general',
    header: 'Labels',
    columns: [
      columnHelper.accessor('studentnumber', {
        key: 'studentnumber-child',
        header: 'Student number',
        cell: ({ row }) => row.original.studentnumber,
      }),
    ],
  }),
  columnHelper.group({
    key: 'information',
    header: 'Information',
    columns: [
      columnHelper.accessor('email', {
        key: 'email-child',
        header: 'Email',
        cell: ({ row }) => row.original.email ?? '',
      }),
      columnHelper.accessor('secondaryEmail', {
        key: 'secondary_email-child',
        header: 'Secondary email',
        cell: ({ row }) => row.original.secondaryEmail ?? '',
      }),
    ],
  }),
  columnHelper.group({
    key: 'courses',
    header: 'Courses',
    columns: labelsToCourses.map(course =>
      columnHelper.display({
        key: `${course.label}-${getTextIn(course.name)}`,
        header: course.label,
        // cellProps: student => findProp(student, course.label),
        cell: ({ row }) => (
          <Tooltip title={findRowValue(row.original, course.label)}>
            <Typography component="div" sx={{ m: 'auto', width: 'fit-content' }}>
              {findRowContent(row.original, course.label)}
            </Typography>
          </Tooltip>
        ),
      })
    ),
  }),
  columnHelper.group({
    key: 'statistics',
    header: 'Total of',
    columns: [
      columnHelper.display({
        key: 'passed',
        header: 'Passed',
        cell: ({ row }) => row.original.totals.passed,
      }),
      columnHelper.display({
        key: 'failed',
        header: 'Failed',
        cell: ({ row }) => row.original.totals.failed,
      }),
      columnHelper.display({
        key: 'unfinished',
        header: 'Unfinished',
        cell: ({ row }) => row.original.totals.unfinished,
      }),
    ],
  }),
]

export const OpenUniPopulationResults = ({ fieldValues }) => {
  const { courseList, startdate, enddate } = fieldValues
  const { getTextIn } = useLanguage()
  const { data, isLoading, isFetching, isSuccess, isError } = useGetOpenUniCourseStudentsQuery(
    { courseList, startdate, enddate },
    { skip: !courseList.length }
  )
  const isFetchingOrLoading = isLoading || isFetching
  const hasFailed = isError || (isSuccess && !data)

  const [columns, tableData, excelData] = useMemo(() => {
    if (isFetchingOrLoading || hasFailed) return []

    const labelsToCourses = data.courses
    const columns = getColumns(
      data.courses.toSorted((a, b) => a.label.localeCompare(b.label)),
      getTextIn
    )

    const tableData = getTableData(data.students)
    const excelData = tableData.map(student => ({
      'Student number': student.studentnumber,
      Email: student.email,
      'Secondary email': student.secondaryEmail,
      ...Object.fromEntries(labelsToCourses.map(course => [course.label, findRowValue(student, course.label)])),
      Passed: student.totals.passed,
      Failed: student.totals.failed,
      Unfinished: student.totals.unfinished,
    }))

    return [columns, tableData, excelData]
  }, [data])

  const accessorKeys = useMemo(
    () => [
      'Student number',
      'Email',
      'Secondary email',
      ...(data?.courses.map(course => course.label).toSorted((a, b) => a.localeCompare(b)) ?? []),
      'Passed',
      'Failed',
      'Unfinished',
    ],
    [data?.courses]
  )

  if (!courseList.length) return <h3>No courses selected.</h3>

  if (isFetchingOrLoading) return <Loading />
  if (hasFailed) return <h3>Something went wrong, please try refreshing the page.</h3>

  const tableOptions = {}

  return (
    <>
      {`Open uni student population (${Object.keys(data.students).length} students)`}
      <OodiTable
        columns={columns}
        data={tableData}
        options={tableOptions}
        toolbarContent={<OodiTableExcelExport data={excelData} exportColumnKeys={accessorKeys} />}
      />
    </>
  )
}
