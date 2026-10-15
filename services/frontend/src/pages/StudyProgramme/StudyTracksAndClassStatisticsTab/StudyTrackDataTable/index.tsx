import { PopulationLink } from '@/components/common/PopulationLink'
import { StartingYearStatsTable, StatsTableGroup } from '@/components/common/StartingYearStatsTable'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { getCalendarYears } from '@/util/timeAndDate'
import { Name } from '@oodikone/shared/types'

const sortMainDataByYear = (data: (string | number)[][][]) => {
  if (!data?.length) {
    return []
  }

  const sortedData: (string | number)[][][] = []
  data.forEach(arrays => {
    if (arrays.length) {
      const copy = [...arrays]
      const sortedYear = copy.sort((a, b) => {
        if (a[0] === 'Total') return 1
        if (b[0] === 'Total') return -1
        if (a[0] < b[0]) return 1
        if (a[0] > b[0]) return -1
        return 0
      })
      sortedData.push(sortedYear.reverse())
    }
  })

  sortedData.reverse()
  return sortedData
}

const sortTrackDataByYear = (data: (string | number)[][] | null) => {
  if (!data?.length) {
    return []
  }

  const copy = [...data]
  const sortedData = copy.sort((a, b) => {
    if (a[0] === 'Total') return -1
    if (b[0] === 'Total') return 1
    if (a[0] < b[0]) return -1
    if (a[0] > b[0]) return 1
    return 0
  })

  sortedData.reverse()
  return sortedData
}

export const StudyTrackDataTable = ({
  combinedProgramme,
  dataOfAllTracks,
  dataOfSingleTrack,
  otherCountriesStats,
  populationLinkVisible,
  showPercentages,
  singleTrack,
  studyProgramme,
  studyTracks,
  titles,
  years,
}: {
  combinedProgramme: string
  dataOfAllTracks: Record<string, (string | number)[][]>
  dataOfSingleTrack: (string | number)[][] | null
  otherCountriesStats: Record<string, Record<string, Record<string, number>>>
  populationLinkVisible: boolean
  showPercentages: boolean
  singleTrack: string | null
  studyProgramme: string
  studyTracks: Record<string, string | Name>
  titles: string[]
  years: string[]
}) => {
  'use memo'
  const { getTextIn } = useLanguage()

  if (!dataOfAllTracks && !dataOfSingleTrack) {
    return null
  }

  const calendarYears = getCalendarYears(years)

  const getPopulationLink = (year: string, studyTrack?: string) =>
    populationLinkVisible ? (
      <PopulationLink
        combinedProgramme={combinedProgramme}
        cypress={year.split(' - ')[0]}
        programme={studyProgramme}
        studyTrack={studyTrack}
        years={year === 'Total' ? calendarYears : [parseInt(year.slice(0, 4), 10)]}
      />
    ) : null

  const getStudyTrackTitle = (studyTrack: string) =>
    studyTracks[studyTrack] === undefined ? studyTrack : `${getTextIn(studyTracks[studyTrack])} (${studyTrack})`

  const getSingleTrackGroups = (code: string): StatsTableGroup[] =>
    sortTrackDataByYear(dataOfSingleTrack).map(([label, ...values]) => {
      const year = label.toString()
      return {
        key: year,
        label: (
          <>
            {year}
            {getPopulationLink(year, code)}
          </>
        ),
        values,
        otherCountries: otherCountriesStats?.[code]?.[year],
        children: [],
      }
    })

  const getAllTracksGroups = (): StatsTableGroup[] =>
    sortMainDataByYear(Object.values(dataOfAllTracks)).flatMap(yearlyData => {
      const yearRow = yearlyData.find(row => years.includes(row[0].toString()))
      if (!yearRow) return []

      const [yearLabel, ...yearValues] = yearRow
      const year = yearLabel.toString()
      return {
        key: year,
        label: (
          <>
            {year}
            {getPopulationLink(year)}
          </>
        ),
        values: yearValues,
        otherCountries: otherCountriesStats?.[studyProgramme]?.[year],
        children: yearlyData
          .filter(row => row !== yearRow)
          .map(([trackLabel, ...values]) => {
            const studyTrack = trackLabel.toString()
            return {
              key: studyTrack,
              label: (
                <>
                  {getStudyTrackTitle(studyTrack)}
                  {getPopulationLink(year, studyTrack)}
                </>
              ),
              values,
              otherCountries: otherCountriesStats?.[studyTrack]?.[year],
            }
          }),
      }
    })

  return (
    <StartingYearStatsTable
      combinedProgramme={!!combinedProgramme}
      cypress="study-tracks-and-class-statistics-data-table"
      groups={singleTrack ? getSingleTrackGroups(singleTrack) : getAllTracksGroups()}
      showPercentages={showPercentages}
      titles={titles}
    />
  )
}
