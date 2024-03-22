/* eslint-disable no-restricted-syntax */
import React, { useState } from 'react'
import { Button, Divider, Loader, Message, Popup } from 'semantic-ui-react'
import { utils, writeFile } from 'xlsx'

import { getTimestamp } from '@/common'
import { facultyToolTips } from '@/common/InfoToolTips'
import { makeTableStats, makeGraphData } from '@/components/common/CreditsProduced'
import { sortProgrammeKeys } from '@/components/FacultyStatistics/facultyHelpers'
import { InteractiveDataTable } from '@/components/FacultyStatistics/InteractiveDataView'
import { InfoBox } from '@/components/Info/InfoBox'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { LineGraph } from '@/components/StudyProgramme/BasicOverview/LineGraph'
import { StackedBarChart } from '@/components/StudyProgramme/BasicOverview/StackedBarChart'
import { Toggle } from '@/components/StudyProgramme/Toggle'
import '@/components/FacultyStatistics/faculty.css'
import {
  useGetFacultyCreditStatsQuery,
  useGetFacultyBasicStatsQuery,
  useGetFacultyThesisStatsQuery,
} from '@/redux/facultyStats'

const calculateTotals = stats => {
  const totals = {}
  for (const id of stats.ids) {
    const providerStats = stats[id].stats
    for (const year of Object.keys(providerStats)) {
      const yearStats = providerStats[year]
      if (!totals[year]) totals[year] = {}
      for (const field of Object.keys(yearStats)) {
        if (field === 'total') continue
        if (!totals[year][field]) totals[year][field] = 0
        if (!totals[year].total) totals[year].total = 0
        totals[year][field] += Math.round(yearStats[field])
        totals[year].total += Math.round(yearStats[field])
      }
    }
  }

  return totals
}

export const BasicOverview = ({
  academicYear,
  faculty,
  setAcademicYear,
  setSpecialGroups,
  setStudyProgrammes,
  specialGroups,
  studyProgrammes,
}) => {
  const yearType = academicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR'
  const studyProgrammeFilter = studyProgrammes ? 'ALL_PROGRAMMES' : 'NEW_STUDY_PROGRAMMES'
  const special = specialGroups ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const [showAll, setShowAll] = useState(false)
  const credits = useGetFacultyCreditStatsQuery({
    id: faculty?.code,
    yearType,
    studyProgrammeFilter,
  })
  const basics = useGetFacultyBasicStatsQuery({
    id: faculty?.code,
    yearType,
    studyProgrammeFilter,
    specialGroups: special,
  })
  const thesisWriters = useGetFacultyThesisStatsQuery({
    id: faculty?.code,
    yearType,
    studyProgrammeFilter,
    specialGroups: special,
  })
  const { getTextIn } = useLanguage()
  const tableStats = credits.data ? makeTableStats(calculateTotals(credits.data), showAll, academicYear) : {}
  const graphStats = credits.data ? makeGraphData(calculateTotals(credits.data), showAll, academicYear) : null

  const programmeStats = credits.data?.ids.reduce((obj, id) => {
    return {
      ...obj,
      [id]: makeTableStats(credits.data[id].stats, showAll, academicYear).data,
    }
  }, {})

  const downloadCsv = (titles, tableStats, programmeStats, programmeNames, toolTipText) => {
    const headers = titles.map(title => ({ label: title === '' ? 'Year' : title, key: title === '' ? 'Year' : title }))
    const csvData = sortProgrammeKeys(Object.keys(programmeStats)).reduce(
      (results, programme) => [
        ...results,
        ...programmeStats[programme].map(yearRow => {
          return {
            Programme: programme,
            Name: getTextIn(programmeNames[programme]),
            ...yearRow.reduce((result, value, valueIndex) => ({ ...result, [headers[valueIndex].key]: value }), {}),
          }
        }),
      ],
      []
    )

    const tableStatsAsCsv = tableStats.map(yearArray =>
      yearArray.reduce((result, value, yearIndex) => ({ ...result, [headers[yearIndex].key]: value }), {})
    )

    const book = utils.book_new()
    const tableSheet = utils.json_to_sheet(tableStatsAsCsv)
    utils.book_append_sheet(book, tableSheet, 'TableStats')
    const sheet = utils.json_to_sheet(csvData)
    utils.book_append_sheet(book, sheet, 'ProgrammeStats')
    writeFile(book, `oodikone_${faculty.code}_${toolTipText}_${getTimestamp()}.xlsx`)
  }

  const getDivider = (title, toolTipText, titles, tableStats, programmeStats, programmeNames) => (
    <>
      <div className="divider">
        <Divider data-cy={`Section-${toolTipText}`} horizontal>
          {title}
        </Divider>
      </div>
      <div style={{ marginBottom: '1em' }}>
        <InfoBox content={facultyToolTips[toolTipText]} cypress={toolTipText} />
      </div>
      <Popup
        content="Download statistics as xlsx file"
        trigger={
          <Button
            floated="right"
            icon="download"
            onClick={() => downloadCsv(titles, tableStats, programmeStats, programmeNames, toolTipText)}
            style={{ backgroundColor: 'white', borderRadius: 0 }}
          />
        }
      />
    </>
  )
  const isFetchingOrLoading =
    credits.isLoading ||
    credits.isFetching ||
    basics.isLoading ||
    basics.isFetching ||
    thesisWriters.isLoading ||
    thesisWriters.isFetching

  const isError =
    (basics.isError && credits.isError && thesisWriters.isError) ||
    (basics.isSuccess &&
      !basics.data &&
      credits.isSuccess &&
      !credits.data &&
      thesisWriters.isSuccess &&
      !thesisWriters.data)

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  const creditSortingTitles = ['Code', 'Total', 'Degree', 'Open uni', 'Exchange', 'Transferred']
  if (showAll) creditSortingTitles.push('Special', 'Other university')
  let transferShortTitles = []
  if (special === 'SPECIAL_INCLUDED') {
    transferShortTitles = ['Code', 'Started', 'Graduated', 'Transferred in', 'Transferred away', 'Transferred to']
  } else {
    transferShortTitles = ['Code', 'Started', 'Graduated']
  }

  const options = {
    KH: 'Bachelors',
    MH: 'Masters',
    T: 'Doctors and Licentiates',
    LIS: 'Doctors and Licentiates',
    OTHER: 'Other',
    H: 'Provided by faculty',
  }

  const getChartPlotLinePlaces = programmeKeys => {
    if (programmeKeys.length === 0) return []
    let key = programmeKeys[0][1].slice(0, 2)
    if (!['KH', 'MH', 'T', 'LIS'].includes(key)) {
      key = 'OTHER'
    }
    const plotLinePlaces = [[0, options[key]]]
    for (let i = 0; i < programmeKeys.length - 1; i++) {
      if (
        (programmeKeys[i][1].startsWith('KH') && programmeKeys[i + 1][1].startsWith('MH')) ||
        (programmeKeys[i][1].startsWith('MH') && programmeKeys[i + 1][1].startsWith('KH')) ||
        (programmeKeys[i][1].startsWith('MH') && programmeKeys[i + 1][1].startsWith('T')) ||
        ((programmeKeys[i][1].startsWith('T') || programmeKeys[i][1].startsWith('LIS')) &&
          (programmeKeys[i + 1][1].startsWith('KH') || programmeKeys[i + 1][1].startsWith('MH'))) ||
        ((programmeKeys[i][1].startsWith('T') ||
          programmeKeys[i][1].startsWith('LIS') ||
          programmeKeys[i][1].startsWith('KH') ||
          programmeKeys[i][1].startsWith('MH')) &&
          programmeKeys[i + 1][1].startsWith('K-'))
      ) {
        let key = programmeKeys[i + 1][1].slice(0, 2)
        if (!['KH', 'MH'].includes(key)) {
          const keyT = programmeKeys[i + 1][1].slice(0, 1)
          const keyLis = programmeKeys[i + 1][1].slice(0, 3)
          if (keyT === 'T') {
            key = keyT
          } else if (keyLis === 'LIS') {
            key = keyLis
          } else {
            key = 'OTHER'
          }
        }
        if (
          !programmeKeys[i + 1][1].includes(faculty.code) &&
          (programmeKeys[i + 1][1].startsWith('MH') || programmeKeys[i + 1][1].startsWith('KH'))
        ) {
          plotLinePlaces.push([i + 1, `${options[key]} secondary`])
        } else {
          plotLinePlaces.push([i + 1, options[key]])
        }
      } else if (programmeKeys[i + 1][1].startsWith('H')) plotLinePlaces.push([i + 1, 'Produced by faculty'])
    }
    return plotLinePlaces
  }

  return (
    <div className="faculty-overview">
      <div className="toggle-container">
        <Toggle
          cypress="YearToggle"
          firstLabel="Calendar year"
          secondLabel="Academic year"
          setValue={setAcademicYear}
          toolTips={facultyToolTips.YearToggle}
          value={academicYear}
        />
        <Toggle
          cypress="ProgrammeToggle"
          firstLabel="New study programmes"
          secondLabel="All study programmes"
          setValue={setStudyProgrammes}
          toolTips={facultyToolTips.ProgrammeToggle}
          value={studyProgrammes}
        />
        <Toggle
          cypress="StudentToggle"
          firstLabel="All studyrights"
          secondLabel="Special studyrights excluded"
          setValue={setSpecialGroups}
          toolTips={facultyToolTips.StudentToggle}
          value={specialGroups}
        />
      </div>

      {isFetchingOrLoading ? (
        <Loader active style={{ marginTop: '15em' }} />
      ) : (
        <>
          {studyProgrammeFilter === 'ALL_PROGRAMMES' && (
            <Message data-cy="FacultyProgrammesShownInfo">
              Please note that the data is complete only for current Bachelor, Masters and Doctoral programmes.
              Especially, credits and thesis writers contain only data for current programmes.
            </Message>
          )}
          {special === 'SPECIAL_EXCLUDED' && (
            <Message data-cy="FacultyExcludeSpecialsInfo">
              Please note: exluding the special studyrights does not have any effects to credits produced by faculty
              -view.
            </Message>
          )}
          {basics.isSuccess && basics.data && (
            <>
              {getDivider(
                'Students of the faculty',
                'StudentsOfTheFaculty',
                basics?.data?.studentInfo.titles,
                basics?.data?.studentInfo.tableStats,
                basics?.data?.studentInfo.programmeTableStats,
                basics?.data?.programmeNames
              )}
              <div className="section-container">
                <div className="graph-container-narrow">
                  <LineGraph
                    cypress="StudentsOfTheFaculty"
                    data={{ ...basics?.data.studentInfo, years: basics.data.years }}
                  />
                </div>
                <div className="table-container-wide">
                  <InteractiveDataTable
                    cypress="StudentsOfTheFaculty"
                    dataProgrammeStats={basics?.data?.studentInfo.programmeTableStats}
                    dataStats={basics?.data?.studentInfo.tableStats}
                    plotLinePlaces={getChartPlotLinePlaces(
                      sortProgrammeKeys(
                        Object.keys(basics?.data?.studentInfo.programmeTableStats).map(obj => [
                          obj,
                          basics?.data?.programmeNames[obj].code,
                        ]),
                        faculty.code
                      )
                    )}
                    programmeNames={basics?.data?.programmeNames}
                    shortNames={transferShortTitles}
                    sliceStart={1}
                    sortedKeys={sortProgrammeKeys(
                      Object.keys(basics?.data?.studentInfo.programmeTableStats).map(obj => [
                        obj,
                        basics?.data?.programmeNames[obj].code,
                      ]),
                      faculty.code
                    ).map(listObj => listObj[0])}
                    titles={basics?.data?.studentInfo.titles}
                    yearsVisible={Array(basics?.data?.studentInfo.tableStats.length).fill(false)}
                  />
                </div>
              </div>
            </>
          )}
          {basics.isSuccess && basics.data && (
            <>
              {getDivider(
                'Graduated of the faculty',
                'GraduatedOfTheFaculty',
                basics?.data?.graduationInfo.titles,
                basics?.data?.graduationInfo.tableStats,
                basics?.data?.graduationInfo.programmeTableStats,
                basics?.data?.programmeNames
              )}
              <div className="section-container">
                <div className="graph-container-narrow">
                  <LineGraph
                    cypress="GraduatedOfTheFaculty"
                    data={{ ...basics?.data.graduationInfo, years: basics.data.years }}
                  />
                </div>
                <div className="table-container-wide">
                  <InteractiveDataTable
                    cypress="GraduatedOfTheFaculty"
                    dataProgrammeStats={basics?.data?.graduationInfo.programmeTableStats}
                    dataStats={basics?.data?.graduationInfo.tableStats}
                    plotLinePlaces={getChartPlotLinePlaces(
                      sortProgrammeKeys(
                        Object.keys(basics?.data?.graduationInfo.programmeTableStats).map(obj => [
                          obj,
                          basics?.data?.programmeNames[obj].code,
                        ]),
                        faculty.code
                      )
                    )}
                    programmeNames={basics?.data?.programmeNames}
                    sliceStart={2}
                    sortedKeys={sortProgrammeKeys(
                      Object.keys(basics?.data?.graduationInfo.programmeTableStats).map(obj => [
                        obj,
                        basics?.data?.programmeNames[obj].code,
                      ]),
                      faculty.code
                    ).map(listObj => listObj[0])}
                    titles={basics?.data?.graduationInfo.titles}
                    yearsVisible={Array(basics?.data?.graduationInfo.tableStats.length).fill(false)}
                  />
                </div>
              </div>
            </>
          )}
          {thesisWriters.isSuccess && thesisWriters.data && (
            <>
              {getDivider(
                'Thesis writers of the faculty',
                'ThesisWritersOfTheFaculty',
                thesisWriters?.data?.titles,
                thesisWriters?.data.tableStats,
                thesisWriters?.data.programmeTableStats,
                thesisWriters?.data?.programmeNames
              )}
              <div className="section-container">
                <div className="graph-container-narrow">
                  <LineGraph
                    cypress="ThesisWritersOfTheFaculty"
                    data={{ ...thesisWriters?.data, years: thesisWriters?.data.years }}
                  />
                </div>
                <div className="table-container-wide">
                  <InteractiveDataTable
                    cypress="ThesisWritersOfTheFaculty"
                    dataProgrammeStats={thesisWriters?.data.programmeTableStats}
                    dataStats={thesisWriters?.data.tableStats}
                    plotLinePlaces={getChartPlotLinePlaces(
                      sortProgrammeKeys(
                        Object.keys(thesisWriters?.data?.programmeTableStats).map(obj => [
                          obj,
                          thesisWriters?.data?.programmeNames[obj].code,
                        ]),
                        faculty.code
                      )
                    )}
                    programmeNames={thesisWriters?.data.programmeNames}
                    sliceStart={2}
                    sortedKeys={sortProgrammeKeys(
                      Object.keys(thesisWriters?.data.programmeTableStats).map(obj => [
                        obj,
                        thesisWriters?.data?.programmeNames[obj].code,
                      ]),
                      faculty.code
                    ).map(listObj => listObj[0])}
                    titles={thesisWriters?.data?.titles}
                    yearsVisible={Array(thesisWriters?.data.tableStats.length).fill(false)}
                  />
                </div>
              </div>
            </>
          )}
          {credits.isSuccess && credits.data && (
            <>
              {getDivider(
                'Credits produced by the faculty',
                'CreditsProducedByTheFaculty',
                credits?.data?.titles,
                credits?.data?.tableStats,
                credits?.data?.programmeTableStats,
                credits?.data?.programmeNames
              )}
              <div>
                <Toggle
                  cypress="showAllCreditsToggle"
                  firstLabel="Show special categories"
                  setValue={setShowAll}
                  value={showAll}
                />
              </div>
              <div className="section-container">
                <div className="graph-container-narrow">
                  <StackedBarChart
                    cypress="CreditsProducedByTheFaculty"
                    data={graphStats.data}
                    labels={graphStats.years}
                    wideTable="narrow"
                  />
                </div>
                <div className="table-container-wide">
                  <InteractiveDataTable
                    cypress="CreditsProducedByTheFaculty"
                    dataProgrammeStats={programmeStats}
                    dataStats={tableStats.data}
                    plotLinePlaces={getChartPlotLinePlaces([
                      ...sortProgrammeKeys(
                        Object.keys(programmeStats)
                          .filter(code => code !== faculty.code)
                          .map(obj => [obj, credits.data.programmeNames[obj]?.code]),
                        faculty.code
                      ),
                      [faculty.code, faculty.code],
                    ])}
                    programmeNames={{
                      ...credits.data.programmeNames,
                      [faculty.code]: { ...faculty.name, code: faculty.code },
                    }}
                    shortNames={creditSortingTitles}
                    sliceStart={2}
                    sortedKeys={[
                      ...sortProgrammeKeys(
                        Object.keys(programmeStats)
                          .filter(code => code !== faculty.code)
                          .map(obj => [obj, credits.data.programmeNames[obj]?.code]),
                        faculty.code
                      ),
                      [faculty.code, faculty.code],
                    ].map(listObj => listObj[0])}
                    titles={tableStats.titles}
                    yearsVisible={Array(tableStats.data.length).fill(false)}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
