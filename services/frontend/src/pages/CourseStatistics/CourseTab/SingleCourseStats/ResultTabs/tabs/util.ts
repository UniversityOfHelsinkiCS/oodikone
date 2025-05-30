import {
  FAILED_GRADES,
  NUMERIC_GRADES,
  PASS_FAIL_GRADES,
  SECOND_NATIONAL_LANGUAGE_GRADES,
  THESIS_GRADES,
} from '@/constants/grades'

const accumulateGrades = (
  series: Array<Record<string, number>>,
  baseAccumulator: Record<string, number[]>,
  getMergedKey: (key: string) => string,
  failedKeys: string[] = []
) => {
  return series.reduce(
    (acc, cur, i) => {
      const currentEntries = Object.entries(cur)
      let failed = 0

      currentEntries.forEach(([k, v]) => {
        const mergedKey = getMergedKey(k)
        if (failedKeys.includes(mergedKey.toLowerCase())) {
          failed += v
        } else {
          acc[mergedKey].push(v)
        }
      })

      if (failed > 0 && acc[0]) {
        acc[0].push(failed)
      }

      Object.entries(acc).forEach(([k, v]) => {
        if (v.length < i + 1) {
          acc[k].push(0)
        }
      })

      return acc
    },
    { ...baseAccumulator } as Record<string, number[]>
  )
}

export const getThesisGradeSpread = (series: Array<Record<string, number>>) => {
  const thesisGradeAccumulator = {
    L: [],
    ECLA: [],
    MCLA: [],
    CL: [],
    LUB: [],
    NSLA: [],
    A: [],
    I: [],
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    'Hyv.': [],
  } as Record<string, number[]>

  const getMergedKey = (key: string) => (key === 'LA' ? 'LUB' : key)

  const newSeries = accumulateGrades(series, thesisGradeAccumulator, getMergedKey)
  return newSeries
}

export const getGradeSpread = (series: Array<Record<string, number>>) => {
  const gradeAccumulator = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    HT: [],
    TT: [],
    'Hyv.': [],
  } as Record<string, number[]>

  const getMergedKey = (key: string) => (Number(key) ? Math.round(Number(key)).toString() : key)

  const newSeries = accumulateGrades(series, gradeAccumulator, getMergedKey, FAILED_GRADES)
  return newSeries
}

export const isThesisGrades = (grades: Record<string, number>) => {
  return Object.keys(grades).some(grade => THESIS_GRADES.includes(grade))
}

const isThesisSeries = (series: Array<Record<string, number>>) => {
  return series?.some(record => isThesisGrades(record))
}

const isSecondNationalLanguageSeries = (series: Array<Record<string, number>>) => {
  return series?.every(record => {
    const grades = Object.keys(record)
    const hasPassFailGrades = grades.some(grade => PASS_FAIL_GRADES.includes(grade))
    const hasNumericGrades = grades.some(grade => NUMERIC_GRADES.includes(grade))
    const hasSecondNationalLanguageGrades = grades.some(grade => SECOND_NATIONAL_LANGUAGE_GRADES.includes(grade))
    return !hasNumericGrades && hasPassFailGrades && hasSecondNationalLanguageGrades
  })
}

const isPassFailSeries = (series: Array<Record<string, number>>) => {
  return series?.every(record => {
    const grades = Object.keys(record)
    const hasPassFailGrades = grades.some(grade => PASS_FAIL_GRADES.includes(grade))
    const hasNumericGrades = grades.some(grade => NUMERIC_GRADES.includes(grade))
    const hasSecondNationalLanguageGrades = grades.some(grade => SECOND_NATIONAL_LANGUAGE_GRADES.includes(grade))
    return !hasNumericGrades && hasPassFailGrades && !hasSecondNationalLanguageGrades
  })
}

export const getSeriesType = (series: Array<Record<string, number>>) => {
  // TODO: Add a new category with only numeric grades ('other' minus TT, HT)

  if (isThesisSeries(series)) {
    return 'thesis'
  }
  if (isSecondNationalLanguageSeries(series)) {
    return 'second-national-language'
  }
  if (isPassFailSeries(series)) {
    return 'pass-fail'
  }
  return 'other'
}
