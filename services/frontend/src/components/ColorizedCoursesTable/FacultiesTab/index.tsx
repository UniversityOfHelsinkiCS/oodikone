import Stack from '@mui/material/Stack'
import { getFilteredRowModel } from '@tanstack/react-table'
import { useMemo } from 'react'
import {
  calculateTotals,
  emptyFields,
  useColorizedCoursesTableContext,
  CourseFilter,
} from '@/components/ColorizedCoursesTable/common'
import '@/components/ColorizedCoursesTable/index.css'
import { useColumns } from '@/components/ColorizedCoursesTable/FacultiesTab/logic'
import {
  ColorModeSelector,
  NumberModeSelector,
  SemesterRangeSelector,
} from '@/components/ColorizedCoursesTable/selectorComponents'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { Section } from '@/components/Section'
import { useDebouncedState } from '@/hooks/debouncedState'
import { useGetFacultiesQuery } from '@/redux/facultyStats'
import { TotalRow } from '../SemestersTab'

export const FacultiesTab = () => {
  const { numberMode, colorMode, selectedSemesters, data } = useColorizedCoursesTableContext()

  const { getTextIn } = useLanguage()
  const facultyQuery = useGetFacultiesQuery()

  const [courseFilter, setCourseFilter] = useDebouncedState('', 250)

  const facultyMap = useMemo(
    () =>
      facultyQuery.data?.reduce((obj, cur) => {
        obj[cur.code] = cur.name
        return obj
      }, {}),
    [facultyQuery?.data]
  )

  const totalRow = useMemo<TotalRow>(() => {
    if (!data) return {} as TotalRow
    return calculateTotals(data.tableData, selectedSemesters, data.faculties)
  }, [data, selectedSemesters])

  const [tableData, excelData] = useMemo(() => {
    if (!data) return []
    const tableData = structuredClone(data.tableData)
    tableData.forEach(course => {
      const facultiesTotal = { ...emptyFields }
      selectedSemesters.forEach(semestercode => {
        data.faculties.forEach(faculty => {
          course.bySemesters.cellStats[faculty] ??= { ...emptyFields }
          const stats = course.bySemesters[semestercode]?.[faculty]
          if (!stats) return
          course.bySemesters.cellStats[faculty].completions += stats.completions
          course.bySemesters.cellStats[faculty].enrollments += stats.enrollments
          course.bySemesters.cellStats[faculty].rejected += stats.rejected
          course.bySemesters.cellStats[faculty].difference = stats.difference
          facultiesTotal.completions += stats.completions
          facultiesTotal.enrollments += stats.enrollments
          facultiesTotal.rejected += stats.rejected
          facultiesTotal.difference += stats.difference
        })
        facultiesTotal.difference += course.bySemesters[semestercode]?.difference ?? 0
      })
      course.bySemesters.facultiesTotal = facultiesTotal
      course.bySemesters = { ...course.bySemesters, facultiesTotal }
    })

    const excelData = tableData.map(({ code, bySemesters }) => ({
      Course: code,
      ...Object.fromEntries(
        data.faculties
          .toSorted()
          .map(facultyCode => [facultyCode, bySemesters.cellStats[facultyCode]?.[numberMode] ?? 0])
      ),
      Total: bySemesters.facultiesTotal[numberMode],
    }))

    return [tableData, excelData]
  }, [selectedSemesters, data, numberMode])

  const cols = useColumns(
    getTextIn,
    [...data.faculties].sort(),
    numberMode,
    colorMode,
    facultyMap,
    totalRow.bySemesters[numberMode]
  )

  const tableOptions = {
    initialState: { columnPinning: { left: ['Course'] } },
    state: {
      useZebrastripes: colorMode === 'none',
      columnFilters: [{ id: 'Course', value: courseFilter }],
    },
    getFilteredRowModel: getFilteredRowModel(),
  }

  return (
    <Section wrapperSx={{ width: '100%', my: '1em' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent={{ xs: 'center', sm: 'space-evenly' }}
        spacing={5}
        sx={{ my: '1em' }}
      >
        <SemesterRangeSelector />
        <NumberModeSelector />
        <ColorModeSelector />
      </Stack>
      <OodiTable
        columns={cols}
        cy="ooditable-faculties"
        data={tableData}
        options={tableOptions}
        toolbarContent={
          <>
            <OodiTableExcelExport data={excelData} exportColumnKeys={cols.map(({ id }) => id)} />
            <CourseFilter setCourseFilter={setCourseFilter} />
          </>
        }
      />
    </Section>
  )
}
