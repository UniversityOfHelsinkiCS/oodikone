import CheckIcon from '@mui/icons-material/Check'

import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CropSquareIcon from '@mui/icons-material/CropSquare'
import RemoveIcon from '@mui/icons-material/HorizontalRule'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'

import { useTheme } from '@mui/material/styles'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { useCallback, useMemo } from 'react'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useStatusNotification } from '@/components/material/StatusNotificationContext'
import { StudentInfoItem } from '@/components/material/StudentInfoItem'
import { DateFormat } from '@/constants/date'
import { formatDate, isWithinSixMonths } from '@/util/timeAndDate'
import { Courses, CourseTabModule, CourseTabStudent } from '.'

const columnHelper = createColumnHelper<CourseTabStudent>()
const dateFormat = DateFormat.DISPLAY_DATE

const getSortingValue = (course: Courses['number'] | undefined) => {
  if (course?.completionDate || course?.passed) return -1
  if (course?.enrollmentDate) return 0
  return 1
}

export const useGetColumnDefinitions = (modules: Map<string, CourseTabModule>): ColumnDef<CourseTabStudent, any>[] => {
  const { getTextIn } = useLanguage()
  const theme = useTheme()
  const { setStatusNotification, closeNotification } = useStatusNotification()

  const handleCopy = useCallback(
    async (event, studentNumbers: string[]) => {
      event.stopPropagation()
      await navigator.clipboard.writeText(studentNumbers.join('\n'))
      setStatusNotification(`Copied ${studentNumbers.length} student numbers`, 'success')
      setTimeout(() => closeNotification(), 3000)
    },
    [setStatusNotification, closeNotification]
  )

  return useMemo(() => {
    return [
      // Static columns
      columnHelper.accessor('studentNumber', {
        header: ({ table }) => {
          const allStudentNumbers = table
            .getFilteredRowModel()
            .rows.map(row => row.original.studentNumber)
            .filter(Boolean)
          return (
            <Stack direction="row" spacing={1} sx={{ verticalAlign: 'middle' }}>
              <Box sx={{ alignSelf: 'center' }}>Student number</Box>
              <Tooltip title="Copy all student numbers to system clipboard">
                <IconButton onClick={event => void handleCopy(event, allStudentNumbers)}>
                  <ContentCopyIcon color="action" />
                </IconButton>
              </Tooltip>
            </Stack>
          )
        },
        cell: cell => {
          const studentNumber = cell.getValue()
          if (studentNumber === 'Hidden') return studentNumber

          const { sisuID } = cell.row.original
          return <StudentInfoItem sisPersonId={sisuID} studentNumber={studentNumber} />
        },
        filterFn: 'includesString',
        aggregationRows: [
          { id: 'passed', value: 'Total passed' },
          { id: 'planned', value: 'Total planned' },
        ],
      }),
      columnHelper.accessor('firstNames', { header: 'First names' }),
      columnHelper.accessor('lastName', { header: 'Last name' }),
      columnHelper.group({
        id: 'total',
        header: _ => <Typography fontWeight="bold">Summary</Typography>,
        columns: [
          columnHelper.accessor('totalPassed', {
            header: 'Total passed',
            cell: ({ cell }) => <Typography>{cell.getValue()}</Typography>,
            aggregationRows: ctx => {
              const passed = ctx.table
                .getFilteredRowModel()
                .rows.reduce((acc, current) => acc + current.original.totalPassed, 0)

              return [{ id: 'passed', value: passed }]
            },
          }),

          columnHelper.accessor('totalPlanned', {
            header: 'Total planned',
            cell: ({ cell }) => <Typography>{cell.getValue()}</Typography>,
            aggregationRows: ctx => {
              const planned = ctx.table
                .getFilteredRowModel()
                .rows.reduce((acc, current) => acc + current.original.totalPlanned, 0)

              return [{ id: 'planned', value: planned }]
            },
          }),
        ],
      }),

      // Dynamic columns
      ...Array.from(modules.entries()).map(([parentCode, parent]) =>
        columnHelper.group({
          id: parentCode,
          header: _ => {
            const name = getTextIn(parent.name)
            return (
              <div title={parentCode + ' - ' + name}>
                <Typography fontWeight="bold">{parentCode}</Typography>
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 'normal',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {name}
                </Typography>
              </div>
            )
          },
          enableSorting: false,
          columns: parent.courses.map(course =>
            columnHelper.accessor(row => row[course.code], {
              id: `${parentCode};${course.code}`,
              header: _ => {
                const courseName = getTextIn(course.name)
                return (
                  <div title={courseName + ' - ' + course.code}>
                    <Typography fontWeight="bold">{course.code}</Typography>
                    <Typography
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 'normal',
                      }}
                    >
                      {getTextIn(course.name)}
                    </Typography>
                  </div>
                )
              },
              cell: ({ cell }) => {
                const correctCourse = cell.row.original[course.code]
                if (!correctCourse) return null

                const sub = correctCourse.substitutedBy
                const substitutePrefix = sub ? `Substituting course: ${sub}\n` : ''

                if (correctCourse.grade) {
                  const title =
                    substitutePrefix +
                    `Grade: ${correctCourse.grade}\nCompleted on: ${formatDate(correctCourse.completionDate, dateFormat)}`
                  return (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: 'auto' }} title={title}>
                      <CheckIcon sx={{ color: sub ? theme.palette.ooditable.hops : theme.palette.ooditable.success }} />
                    </div>
                  )
                } else if (correctCourse.enrollmentDate) {
                  return (
                    <div
                      style={{ display: 'flex', justifyContent: 'center', margin: 'auto' }}
                      title={
                        substitutePrefix + `Last enrollment ${formatDate(correctCourse.enrollmentDate, dateFormat)}`
                      }
                    >
                      <RemoveIcon
                        sx={{
                          color: isWithinSixMonths(correctCourse.enrollmentDate)
                            ? theme.palette.ooditable.recentEnrollment
                            : theme.palette.ooditable.enrollment,
                        }}
                      />
                    </div>
                  )
                } else if (correctCourse.inHops) {
                  return (
                    <div
                      style={{ display: 'flex', justifyContent: 'center', margin: 'auto' }}
                      title={substitutePrefix + 'In primary studyplan'}
                    >
                      <CropSquareIcon sx={{ color: theme.palette.ooditable.hops }} />
                    </div>
                  )
                }
                return null
              },
              invertSorting: true,
              sortingFn: (rowA, rowB) => {
                /* Sorting values:
                 * -1 - course completed
                 *  0 - enrollment
                 *  1 - hops
                 * invertSorting needs to be on
                 */
                const courseA = rowA.original[course.code]
                const courseB = rowB.original[course.code]
                return getSortingValue(courseA) - getSortingValue(courseB)
              },
              aggregationRows: ({ table }) => {
                const { passed, planned } = table.getFilteredRowModel().rows.reduce(
                  (acc, row) => {
                    const original = row.original[course.code]
                    if (original?.completionDate) {
                      acc.passed++
                    } else if (original?.enrollmentDate || original?.inHops) {
                      acc.planned++
                    }
                    return acc
                  },
                  { passed: 0, planned: 0 }
                )
                return [
                  { id: 'passed', value: passed },
                  { id: 'planned', value: planned },
                ]
              },
            })
          ),
        })
      ),
    ]
  }, [modules, theme, getTextIn, handleCopy])
}
