import { useMemo } from 'react'

import {
  calculateTotals,
  emptyFields,
  useColorizedCoursesTableContext,
} from '@/components/ColorizedCoursesTable/common'
import '@/components/ColorizedCoursesTable/index.css'
import {
  ColorModeSelector,
  NumberModeSelector,
  SemesterRangeSelector,
} from '@/components/ColorizedCoursesTable/selectorComponents'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { useGetFacultiesQuery } from '@/redux/facultyStats'
import { useColumns } from './logic'

export const FacultiesTab = () => {
  const { numberMode, colorMode, semesterFilter, setSemesterFilter, selectedSemesters, data } =
    useColorizedCoursesTableContext()

  const { getTextIn } = useLanguage()
  const facultyQuery = useGetFacultiesQuery()

  const facultyMap = useMemo(
    () =>
      facultyQuery.data?.reduce((obj, cur) => {
        obj[cur.code] = cur.name
        return obj
      }, {}),
    [facultyQuery?.data]
  )

  const totalRow = useMemo(() => {
    if (!data) return {}
    return calculateTotals(data.tableData, selectedSemesters, data.faculties)
  }, [data, facultyMap])

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
  }, [selectedSemesters, data])

  const cols = useColumns(
    getTextIn,
    [...data.faculties].sort(),
    numberMode,
    colorMode,
    facultyMap,
    totalRow.bySemesters[numberMode]
  )

  if (!facultyMap) return null

  const tableOptions = {
    initialState: { columnPinning: { left: ['Course'] } },
    state: {
      useZebrastripes: colorMode === 'none',
    },
  }

  return (
    <div>
      <div className="options-container">
        <SemesterRangeSelector semesterFilter={semesterFilter} setSemesterFilter={setSemesterFilter} />
        <NumberModeSelector />
        <ColorModeSelector />
      </div>
      <OodiTableExcelExport data={excelData} exportColumnKeys={cols.map(({ id }) => id)} />
      <OodiTable columns={cols} data={tableData} options={tableOptions} />
    </div>
  )
}
