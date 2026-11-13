import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import type { TableOptions } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { StudentNameVisibilityToggle, useStudentNameVisibility } from '@/components/common/StudentNameVisibilityToggle'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { LoadingSection } from '@/components/Loading'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { DateFormat } from '@/constants/date'
import { useTitle } from '@/hooks/title'
import { useSemesters } from '@/hooks/useSemesters'
import { CONTACT_COLUMN_IDS, useCloseToGraduationColumns } from '@/pages/CloseToGraduation/Beta/columns'
import { toExportRows } from '@/pages/CloseToGraduation/Beta/excelExport'
import { FilterSection } from '@/pages/CloseToGraduation/Beta/FilterSection'
import {
  emptyFilters,
  filterStudents,
  getFilterOptions,
  pruneFilters,
  type CloseToGraduationFilters,
} from '@/pages/CloseToGraduation/Beta/filters'
import type { CloseToGraduationTab } from '@/pages/CloseToGraduation/Beta/tabs'
import { getDisplayedSemesterCodes } from '@/pages/CloseToGraduation/common'
import { useGetStudentsCloseToGraduationQuery } from '@/redux/closeToGraduation'
import { reformatDate } from '@/util/timeAndDate'
import type { CloseToGraduationData } from '@oodikone/shared/routes/populations'

export const CloseToGraduationBeta = () => {
  useTitle('Students close to graduation')
  const { data: students, isFetching } = useGetStudentsCloseToGraduationQuery()
  const { semesters, currentSemester, isLoading: semestersLoading } = useSemesters()
  const { getTextIn } = useLanguage()
  const { visible: namesVisible } = useStudentNameVisibility()
  const columns = useCloseToGraduationColumns()

  const [selectedTab, setSelectedTab] = useState<CloseToGraduationTab>('bachelor')
  const [filtersByTab, setFiltersByTab] = useState<Record<CloseToGraduationTab, CloseToGraduationFilters>>({
    bachelor: emptyFilters,
    masterAndLicentiate: emptyFilters,
  })

  const tabRows = useMemo(() => students?.[selectedTab] ?? [], [students, selectedTab])
  const filters = filtersByTab[selectedTab]

  const filterOptions = useMemo(() => getFilterOptions(tabRows, filters, getTextIn), [tabRows, filters, getTextIn])
  const filteredRows = useMemo(() => filterStudents(tabRows, filters, getTextIn), [tabRows, filters, getTextIn])

  const semestersToInclude = useMemo(
    () => getDisplayedSemesterCodes(currentSemester?.semestercode),
    [currentSemester?.semestercode]
  )
  const exportRows = useMemo(
    () => toExportRows(filteredRows, getTextIn, semesters, semestersToInclude),
    [filteredRows, getTextIn, semesters, semestersToInclude]
  )
  const exportColumnKeys = useMemo(() => Object.keys(exportRows[0] ?? {}), [exportRows])

  const updateFilters = (nextFilters: CloseToGraduationFilters) =>
    setFiltersByTab(previous => ({ ...previous, [selectedTab]: pruneFilters(tabRows, nextFilters, getTextIn) }))

  const tableOptions: Partial<TableOptions<CloseToGraduationData>> = {
    initialState: {
      sorting: [{ id: 'programme', desc: false }],
    },
    state: {
      columnVisibility: Object.fromEntries(CONTACT_COLUMN_IDS.map(id => [id, namesVisible])),
    },
  }

  return (
    <PageLayout maxWidth="lg">
      <PageTitle title="Students close to graduation" />
      <Tabs centered onChange={(_event, value: CloseToGraduationTab) => setSelectedTab(value)} value={selectedTab}>
        <Tab label="Bachelor's programmes" value="bachelor" />
        <Tab label="Master's and licentiate's programmes" value="masterAndLicentiate" />
      </Tabs>

      {isFetching || semestersLoading ? (
        <LoadingSection />
      ) : (
        <>
          <FilterSection
            filters={filters}
            onChange={updateFilters}
            options={filterOptions}
            shownCount={filteredRows.length}
            tab={selectedTab}
            totalCount={tabRows.length}
          />
          <Box sx={{ mb: -2, mt: 1 }}>
            {students?.lastUpdated ? (
              <Typography color="text.secondary" variant="body2">
                Last updated: {reformatDate(students.lastUpdated, DateFormat.LONG_DATE_TIME)}
              </Typography>
            ) : null}
          </Box>
          {filteredRows.length ? (
            <OodiTable
              columns={columns}
              cy="close-to-graduation-table"
              data={filteredRows}
              key={selectedTab}
              options={tableOptions}
              toolbarContent={
                <>
                  <OodiTableExcelExport data={exportRows} exportColumnKeys={exportColumnKeys} />
                  <StudentNameVisibilityToggle label="Show contact information" />
                </>
              }
            />
          ) : (
            <Typography sx={{ my: 5 }}>No students matching the current filters, or missing access rights.</Typography>
          )}
        </>
      )}
    </PageLayout>
  )
}
