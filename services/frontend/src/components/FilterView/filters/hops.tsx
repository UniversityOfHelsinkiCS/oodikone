import { FilterTrayProps } from '../FilterTray'
import { FilterRadio } from './common/FilterRadio'
import { FilterSwitch } from './common/FilterSwitch'
import { createFilter } from './createFilter'

const CombinedProgramme = ({ options, onOptionsChange, combinedProgramme }) => {
  // For combined programme, we show radiobuttons due to many possible options
  const typeOfCombined = combinedProgramme === 'MH90_001' ? 'Licentiate' : 'Master'

  const modeObject = {
    None: () =>
      onOptionsChange({
        ...options,
        activeProgramme: false,
        activeCombinedProgramme: false,
        combinedIsSelected: 'default',
      }),
    'Bachelor studyright': () =>
      onOptionsChange({
        ...options,
        activeProgramme: true,
        activeCombinedProgramme: false,
        combinedIsSelected: 'default',
      }),
    [`${typeOfCombined} studyright`]: () =>
      onOptionsChange({
        ...options,
        activeProgramme: false,
        activeCombinedProgramme: true,
        combinedIsSelected: combinedProgramme,
      }),
    'Both studyrights': () =>
      onOptionsChange({
        ...options,
        activeProgramme: true,
        activeCombinedProgramme: true,
        combinedIsSelected: combinedProgramme,
      }),
  }

  const modeOptions = Object.keys(modeObject).map(key => ({
    key,
    text: key,
    value: key,
  }))

  const defaultOption = modeOptions.shift()!

  return (
    <FilterRadio
      defaultOption={defaultOption}
      filterKey="hopsFilter"
      onChange={({ target }) => modeObject[target.value]()}
      options={modeOptions}
    />
  )
}

const SingleProgramme = ({ options, onOptionsChange }) => {
  const modeOptions = [
    {
      key: 'Default studyright',
      text: 'Show only credits included in study plan',
      checked: options.activeProgramme,
      onClick: () =>
        onOptionsChange({
          ...options,
          activeProgramme: !options.activeProgramme,
          combinedIsSelected: 'default',
        }),
    },
  ]

  return <FilterSwitch filterKey="hopsFilter" options={modeOptions} />
}

const HopsFilterCard = ({ options, onOptionsChange, precomputed: combinedProgramme }: FilterTrayProps) => {
  if (combinedProgramme)
    return (
      <CombinedProgramme combinedProgramme={combinedProgramme} onOptionsChange={onOptionsChange} options={options} />
    )
  return <SingleProgramme onOptionsChange={onOptionsChange} options={options} />
}

export const hopsFilter = createFilter({
  key: 'hops',

  title: 'Personal study plan',

  defaultOptions: {
    activeProgramme: false,
    activeCombinedProgramme: false,
    combinedIsSelected: 'default',
  },

  precompute: ({ args }) => args.combinedProgrammeCode,

  isActive: arg => !!arg?.activeProgramme || !!arg?.activeCombinedProgramme,

  filter: (student, { args, options }) => {
    const { activeProgramme, activeCombinedProgramme } = options

    const studyRights = student.studyRights.filter(({ cancelled }) => !cancelled).map(({ id }) => id)
    const hops = student.studyplans.find(
      ({ programme_code, sis_study_right_id }) =>
        programme_code === args.programmeCode && studyRights.includes(sis_study_right_id)
    )
    const secondHops = student.studyplans.find(
      ({ programme_code, sis_study_right_id }) =>
        programme_code === args.combinedProgrammeCode && studyRights.includes(sis_study_right_id)
    )

    if (activeProgramme || activeCombinedProgramme) {
      if (!hops && !secondHops) {
        student.courses = []
        return true
      }
      const courses = new Set(hops && activeProgramme ? hops.included_courses : [])
      const secondProgrammeCourses = new Set(secondHops && activeCombinedProgramme ? secondHops.included_courses : [])
      const hopsCourses = student.courses.filter(
        ({ course_code }) => courses.has(course_code) || secondProgrammeCourses.has(course_code)
      )
      student.courses = [...new Set(hopsCourses)]
      return true
    }

    return true
  },

  selectors: {
    isPrimarySelected: ({ activeProgramme }) => !!activeProgramme,
    isCombinedSelected: ({ combinedIsSelected }, code) => combinedIsSelected === code,
    isBothSelected: ({ combinedIsSelected, activeProgramme }, code) => combinedIsSelected === code && activeProgramme,
  },

  actions: {
    toggle: options => {
      options.activeProgramme = !options.activeProgramme
      options.activeCombinedProgramme = false
      options.combinedIsSelected = 'default'

      return options
    },
    toggleCombinedProgramme: (options, combinedProgrammeCode) => {
      options.activeProgramme = false
      options.activeCombinedProgramme = !options.activeCombinedProgramme
      options.combinedIsSelected =
        options.combinedIsSelected === combinedProgrammeCode ? 'default' : combinedProgrammeCode

      return options
    },
  },

  render: HopsFilterCard,
})
