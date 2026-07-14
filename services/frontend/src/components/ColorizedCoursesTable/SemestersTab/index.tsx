import Stack from '@mui/material/Stack'
import { getFilteredRowModel } from '@tanstack/react-table'
import { useMemo } from 'react'

import {
  calculateNewTotalColumnValues,
  calculateTotals,
  useColorizedCoursesTableContext,
  CourseFilter,
} from '@/components/ColorizedCoursesTable/common'
import {
  ColorModeSelector,
  NumberModeSelector,
  SemesterRangeSelector,
} from '@/components/ColorizedCoursesTable/selectorComponents'
import '@/components/ColorizedCoursesTable/index.css'
import { useColumns } from '@/components/ColorizedCoursesTable/SemestersTab/logic'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { Section } from '@/components/Section'
import { useDebouncedState } from '@/hooks/debouncedState'

type TotalRow = ReturnType<typeof calculateTotals>

export const SemestersTab = ({ languagecenterview }: { languagecenterview: boolean }) => {
  const { getTextIn } = useLanguage()
  const { semesters, numberMode, colorMode, selectedSemesters, data } = useColorizedCoursesTableContext()
  const [courseFilter, setCourseFilter] = useDebouncedState('', 250)

  const totalRow = useMemo<TotalRow>(() => {
    if (!data) return {} as TotalRow
    return calculateTotals(data.tableData, selectedSemesters)
  }, [data, selectedSemesters])

  const [tableData, excelData] = useMemo(() => {
    if (!data) return []
    const tableData = calculateNewTotalColumnValues(data.tableData, selectedSemesters.map(String))
    const excelData = tableData.map(({ code, bySemesters }) => ({
      Course: code,
      ...Object.fromEntries(
        semesters
          .filter(({ semestercode }) => selectedSemesters.includes(semestercode))
          .map(({ name, semestercode }) => [`${getTextIn(name)}`, bySemesters[semestercode]?.[numberMode] ?? 0])
      ),
      Total: bySemesters[numberMode],
    }))

    return [tableData, excelData]
  }, [data, selectedSemesters])

  const cols = useColumns(
    getTextIn,
    semesters.filter(({ semestercode }) => selectedSemesters.includes(semestercode)),
    numberMode,
    colorMode,
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
    <Section title={languagecenterview ? undefined : 'Programme courses by semester'} wrapperSx={{ width: '100%' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent={{ xs: 'center', sm: 'space-evenly' }} spacing={5}>
        <SemesterRangeSelector />
        <NumberModeSelector />
        <ColorModeSelector />
      </Stack>
      <OodiTable
        columns={cols}
        cy="ooditable-semesters"
        data={tableData}
        options={tableOptions}
        toolbarContent={
          <>
            <OodiTableExcelExport data={excelData} exportColumnKeys={cols.map(({ header }) => header)} />
            <CourseFilter setCourseFilter={setCourseFilter} />
          </>
        }
      />
    </Section>
  )
}
