import { cloneDeep } from 'lodash'
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
import { SortableTable, row } from '@/components/SortableTable'
import { useGetFacultiesQuery } from '@/redux/facultyStats'
import { getColumns } from './logic'

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
    const totals = calculateTotals(data.tableData, selectedSemesters, data.faculties)
    return row(totals, { ignoreFilters: true, ignoreSorting: true })
  }, [data, facultyMap])

  const tableData = useMemo(() => {
    const tableData = [cloneDeep(totalRow), ...cloneDeep(data.tableData)]
    tableData.forEach(course => {
      const facultiesTotal = { ...emptyFields }
      selectedSemesters.forEach(semestercode => {
        data.faculties.forEach(faculty => {
          if (!course.bySemesters.cellStats[faculty]) course.bySemesters.cellStats[faculty] = { ...emptyFields }
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
    return tableData
  }, [selectedSemesters, data])

  if (!facultyMap) return null

  return (
    <div>
      <div className="options-container">
        <SemesterRangeSelector semesterFilter={semesterFilter} setSemesterFilter={setSemesterFilter} />
        <NumberModeSelector />
        <ColorModeSelector />
      </div>
      <SortableTable
        columns={getColumns(
          getTextIn,
          [...data.faculties].sort(),
          numberMode,
          colorMode,
          facultyMap,
          totalRow.bySemesters[numberMode]
        )}
        data={tableData}
        stretch
        striped={colorMode === 'none'}
      />
    </div>
  )
}
