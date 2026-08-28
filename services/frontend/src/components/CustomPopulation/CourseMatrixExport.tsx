import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import { utils, writeFile } from 'xlsx'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DownloadIcon } from '@/theme'
import { FilteredCourse } from '@/util/coursesOfPopulation'
import { getTimestamp } from '@/util/timeAndDate'
import { FormattedStudent } from '@oodikone/shared/types'

import { calculateExcelData } from '@/components/CustomPopulation/courseMatrix'

export const CourseMatrixExport = ({
  students,
  courses,
}: {
  students: FormattedStudent[]
  courses: FilteredCourse[]
}) => {
  const { getTextIn } = useLanguage()

  const getXlsx = () => {
    const courseInfoById = new Map(
      courses.map(({ course }) => [course.id, { code: course.code, name: getTextIn(course.name) ?? '' }])
    )
    const { completedCoursesRows, courseCounterRows } = calculateExcelData(students, courseInfoById)

    // Columns: Student number, Name, student's attainments in the format: "course name (course code)"
    const completedCoursesSheet = utils.aoa_to_sheet([['Student number', 'Name'], ...completedCoursesRows])
    // Columns: Code, Course name, Student count, Total credits
    const courseCounterSheet = utils.aoa_to_sheet([
      ['Code', 'Course name', 'Student count', 'Total credits'],
      ...courseCounterRows,
    ])

    const workbook = utils.book_new()
    utils.book_append_sheet(workbook, completedCoursesSheet, 'Completed courses')
    utils.book_append_sheet(workbook, courseCounterSheet, 'Course statistics')
    return workbook
  }

  const filename = `oodikone_course_matrix_${students.length}_students_${getTimestamp()}.xlsx`

  return (
    <Tooltip title="Download an Excel workbook with each student's completed (HOPS-included) courses.">
      <Button
        color="primary"
        onClick={() => writeFile(getXlsx(), filename)}
        startIcon={<DownloadIcon />}
        variant="contained"
      >
        Export courses
      </Button>
    </Tooltip>
  )
}
