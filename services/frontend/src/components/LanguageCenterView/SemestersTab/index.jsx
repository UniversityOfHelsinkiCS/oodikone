/* eslint-disable import/prefer-default-export */
import React, { useEffect, useMemo } from 'react'
import { Loader } from 'semantic-ui-react'
import SortableTable, { row } from 'components/SortableTable'
import { useGetLanguageCenterDataQuery } from 'redux/languageCenterView'
import useLanguage from 'components/LanguagePicker/useLanguage'
import { calculateTotals, getColumns } from './logic'
import { useLanguageCenterContext } from '../common'
import '../index.css'
import { ColorModeSelector, CompletionPicker, SemesterRangeSelector } from '../selectorComponents'

export const SemestersTab = () => {
  const { getTextIn } = useLanguage()
  const { setSemesterFilter, semesterFilter, semesters, numberMode, colorMode, selectedSemesters, setNumberMode } =
    useLanguageCenterContext()
  const { data, isFetchingOrLoading, isError } = useGetLanguageCenterDataQuery()

  useEffect(() => {
    if (numberMode === 'ratio') {
      setNumberMode('completed')
    }
  }, [])

  const totalRow = useMemo(() => {
    if (!data) return null
    const totals = calculateTotals(data.tableData, selectedSemesters)
    return row(totals, { ignoreSorting: true, ignoreFilters: true })
  }, [data, selectedSemesters])

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (!data || isFetchingOrLoading || !semesterFilter || !semesters)
    return <Loader active style={{ marginTop: '15em' }} />

  if (numberMode === 'ratio') return null
  if (!semesters) return null
  return (
    <div>
      <div className="options-container">
        <SemesterRangeSelector setSemesterFilter={setSemesterFilter} semesterFilter={semesterFilter} />
        <CompletionPicker enableRatioOption={false} />
        <ColorModeSelector />
      </div>
      <SortableTable
        columns={getColumns(
          getTextIn,
          semesters.filter(({ semestercode }) => selectedSemesters.includes(semestercode)),
          numberMode,
          colorMode,
          totalRow.bySemesters[numberMode]
        )}
        data={[totalRow, ...data.tableData]}
        striped={colorMode === 'none'}
        stretch
      />
    </div>
  )
}
