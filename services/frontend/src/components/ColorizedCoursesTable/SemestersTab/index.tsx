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
import {
  getSemestersExcelRows,
  COURSE_EXCEL_KEYS,
  type SemestersTabCourse,
} from '@/components/ColorizedCoursesTable/SemestersTab/excel'
import { useColumns } from '@/components/ColorizedCoursesTable/SemestersTab/logic'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { Section } from '@/components/Section'
import { useDebouncedState } from '@/hooks/debouncedState'

export type TotalRow = ReturnType<typeof calculateTotals>

export const SemestersTab = ({ languagecenterview }: { languagecenterview: boolean }) => {
  const { getTextIn } = useLanguage()
  const { semesters, numberMode, colorMode, selectedSemesters, data } = useColorizedCoursesTableContext()
  const [courseFilter, setCourseFilter] = useDebouncedState('', 250)

  const totalRow = useMemo<TotalRow>(() => {
    if (!data) return {} as TotalRow
    return calculateTotals(data.tableData, selectedSemesters)
  }, [data, selectedSemesters])

  const shownSemesters = useMemo(
    () => semesters.filter(({ semestercode }) => selectedSemesters.includes(semestercode)),
    [semesters, selectedSemesters]
  )

  const tableData = useMemo<SemestersTabCourse[]>(() => {
    if (!data) return []
    return calculateNewTotalColumnValues(data.tableData, selectedSemesters.map(String))
  }, [data, selectedSemesters])

  const cols = useColumns(getTextIn, shownSemesters, numberMode, colorMode, totalRow.bySemesters[numberMode])

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
        cy="ooditable-semesters"
        data={tableData}
        options={tableOptions}
        toolbarContent={table => (
          <>
            <OodiTableExcelExport
              data={getSemestersExcelRows(
                table.getFilteredRowModel().rows.map(row => row.original),
                shownSemesters,
                numberMode,
                getTextIn
              )}
              exportColumnKeys={[...COURSE_EXCEL_KEYS, ...cols.slice(1).map(({ header }) => header)]}
            />
            <CourseFilter setCourseFilter={setCourseFilter} />
          </>
        )}
      />
    </Section>
  )
}
