import { utils, writeFile } from 'xlsx'

import { GetTextIn } from '@/components/LanguagePicker/useLanguage'
import { getTimestamp } from '@/util/timeAndDate'
import { Name, StudyTrackStats } from '@oodikone/shared/types'

/* This is theoretically useless, as js would sort exactly the same way without a function, but w.e */
const sortByYear = (a: string, b: string) => {
  if (a === 'Total') return 1
  if (b === 'Total') return -1

  const yearA = +a.split(' - ')[0]
  const yearB = +b.split(' - ')[0]

  return yearB - yearA
}

const singleStudytrack = (data: StudyTrackStats, studyProgramme: string, studyTrack: string, getTextIn: GetTextIn) => {
  const book = utils.book_new()
  const { id, populationTitles, mainStatsByTrack, studyTracks, years, otherCountriesCount } = data

  const [_, __, ...titles] = populationTitles

  const stats = Object.entries(mainStatsByTrack)
    .filter(([track, _]) => studyTrack == track)
    .flatMap(([track, trackData]) =>
      trackData
        // HACK: For some reason there is a "read-only 0" in the dataset, so in-plce sort crashes
        // NOTE: The first element should be the academic year indicator, so the value is infered to be a string.
        .toSorted(([a], [b]) => sortByYear(a as string, b as string))
        .map(([year, all, ...rest]) => ({
          'Academic Year': year,
          'Study Track': track,
          // HACK: The name should always be a Name (unless indicating programme name)
          Name: getTextIn(studyTracks[track] as Name),
          All: all,
          ...Object.fromEntries(
            rest.map((item, index) => [`${titles[Math.floor(index / 2)]}${index % 2 === 0 ? '' : ' %'}`, item])
          ),
        }))
    )

  const stat_sheet = utils.json_to_sheet(stats)
  utils.book_append_sheet(book, stat_sheet, 'StudyTrackStats')

  // HACK: For some reason there is a "read-only 0" in the dataset, so in-plce sort crashes
  years.toSorted(sortByYear).forEach(year => {
    const countries = Array.from(
      new Set(
        Object.entries(otherCountriesCount)
          .filter(([track, _]) => studyTrack == track)
          .flatMap(([_, trackData]) => Object.keys(trackData[year] ?? {}))
      )
    ).sort()
    const countriesStats = Object.entries(otherCountriesCount)
      .filter(([track, _]) => studyTrack == track)
      .map(([track, trackData]) => ({
        'Academic Year': year,
        'Study Track': track,
        // HACK: The name should always be a Name (unless indicating programme name)
        Name: track !== id ? getTextIn(studyTracks[track] as Name) : 'All students of the programme',

        ...Object.fromEntries(countries.map(country => [country, trackData[year]?.[country] ?? ''])),
      }))

    const countriesSheet = utils.json_to_sheet(countriesStats)
    utils.book_append_sheet(book, countriesSheet, `CountriesStats-${year}`)
  })

  writeFile(book, `oodikone_${studyProgramme}_${studyTrack}_stats_${getTimestamp()}.xlsx`)
}

const fullProgramme = (data: StudyTrackStats, studyProgramme: string, getTextIn: GetTextIn) => {
  const book = utils.book_new()
  const { id, populationTitles, mainStatsByTrack, studyTracks, years, otherCountriesCount } = data

  const [_, __, ...titles] = populationTitles

  const total = Object.entries(mainStatsByTrack)
    .filter(([track, _]) => track === studyProgramme)
    .flatMap(([_, trackData]) =>
      trackData
        // HACK: For some reason there is a "read-only 0" in the dataset, so in-plce sort crashes
        // NOTE: The first element should be the academic year indicator, so the value is infered to be a string.
        .toSorted(([a], [b]) => sortByYear(a as string, b as string))
        .map(([year, all, ...rest]) => ({
          '': year,
          All: all,
          ...Object.fromEntries(
            rest.map((item, index) => [`${titles[Math.floor(index / 2)]}${index % 2 === 0 ? '' : ' %'}`, item])
          ),
        }))
    )

  const total_sheet = utils.json_to_sheet(total)
  utils.book_append_sheet(book, total_sheet, 'TotalTableStats')

  const stats = Object.entries(mainStatsByTrack).flatMap(([track, trackData]) =>
    trackData
      // HACK: For some reason there is a "read-only 0" in the dataset, so in-plce sort crashes
      // NOTE: The first element should be the academic year indicator, so the value is infered to be a string.
      .toSorted(([a], [b]) => sortByYear(a as string, b as string))
      .map(([year, all, ...rest]) => ({
        'Academic Year': year,
        'Study Track': track,
        // HACK: The name should always be a Name (unless indicating programme name)
        Name: track !== id ? getTextIn(studyTracks[track] as Name) : 'All students of the programme',
        All: all,
        ...Object.fromEntries(
          rest.map((item, index) => [`${titles[Math.floor(index / 2)]}${index % 2 === 0 ? '' : ' %'}`, item])
        ),
      }))
  )

  const stat_sheet = utils.json_to_sheet(stats)
  utils.book_append_sheet(book, stat_sheet, 'StudytrackStats')

  // HACK: For some reason there is a "read-only 0" in the dataset, so in-plce sort crashes
  years.toSorted(sortByYear).forEach(year => {
    const countries = Array.from(
      new Set(Object.values(otherCountriesCount).flatMap(track => Object.keys(track[year] ?? {})))
    ).sort()
    const countriesStats = Object.entries(otherCountriesCount).map(([track, trackData]) => ({
      'Academic Year': year,
      Studytrack: track,
      // HACK: The name should always be a Name (unless indicating programme name)
      Name: track !== id ? getTextIn(studyTracks[track] as Name) : 'All students of the programme',

      ...Object.fromEntries(countries.map(country => [country, trackData[year]?.[country] ?? ''])),
    }))

    const countriesSheet = utils.json_to_sheet(countriesStats)
    utils.book_append_sheet(book, countriesSheet, `CountriesStats-${year}`)
  })

  writeFile(book, `oodikone_${studyProgramme}_stats_${getTimestamp()}.xlsx`)
}

export const exportStudentTable = (
  data: StudyTrackStats | undefined,
  studyProgramme: string,
  studyTrack: string,
  getTextIn: GetTextIn
) => {
  if (!data) return

  if (studyTrack !== studyProgramme) return singleStudytrack(data, studyProgramme, studyTrack, getTextIn)
  return fullProgramme(data, studyProgramme, getTextIn)
}
