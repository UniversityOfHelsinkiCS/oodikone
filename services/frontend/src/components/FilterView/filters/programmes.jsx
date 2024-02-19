import React, { useMemo } from 'react'
import { Dropdown } from 'semantic-ui-react'
import * as _ from 'lodash-es'
import moment from 'moment'

import { useLanguage } from '../../LanguagePicker/useLanguage'
import { createFilter } from './createFilter'

const NO_PROGRAMME = {
  code: '00000',
  name: { en: 'No programme', fi: 'Ei ohjelmaa' },
  startdate: '',
}

const ProgrammeFilterCard = ({
  options,
  onOptionsChange,
  programmes,
  withoutSelf,
  studyRightPredicate,
  studentToProgrammeMap,
  additionalModes,
}) => {
  const { getTextIn } = useLanguage()
  const { selectedProgrammes } = options
  const name = 'programmeFilterCard'

  const visibleProgrammes = (() => {
    const studentProgrammePairs = _.flatMap(withoutSelf(), student =>
      _.get(studentToProgrammeMap, student.studentNumber, []).map(programme => ({ student, programme }))
    )
    const groupedByStudentNumber = _.groupBy(studentProgrammePairs, 'student.studentNumber')
    const filteredByProgramme = _.pickBy(groupedByStudentNumber, pairs =>
      _.some(pairs, ({ programme }) => options.selectedProgrammes.every(pcode => programme.code === pcode))
    )
    const filteredPairs = _.chain(filteredByProgramme)
      .values()
      .flatten()
      .filter(({ student, programme }) => studyRightPredicate(student, programme))
      .value()
    const programmes = _.map(filteredPairs, 'programme')
    const programmeCounts = _.reduce(
      programmes,
      (acc, details) => {
        if (!acc[details.code]) {
          acc[details.code] = { ...details, studentCount: 0 }
        }
        acc[details.code].studentCount += 1
        return acc
      },
      {}
    )
    return _.values(programmeCounts)
  })()

  const dropdownOptions = useMemo(
    () =>
      _.chain(visibleProgrammes)
        .concat(selectedProgrammes.map(code => programmes.find(p => p && p.code === code)))
        .map(program => {
          const code = program?.code ?? NO_PROGRAMME.code
          const name = program?.name ?? NO_PROGRAMME.name
          const studentCount = program?.studentCount ?? -1
          return {
            key: `programme-filter-value-${code}`,
            text: getTextIn(name),
            value: code,
            content: (
              <>
                {getTextIn(name)}{' '}
                <span style={{ color: 'rgb(136, 136, 136)', whiteSpace: 'nowrap' }}>({studentCount} students)</span>
              </>
            ),
          }
        })
        .uniqBy('value')
        .sort((a, b) => a.text.localeCompare(b.text))
        .value(),
    [programmes]
  )

  const handleChange = (_, { value }) => {
    onOptionsChange({
      ...options,
      selectedProgrammes: value,
    })
  }

  const setMode = mode => {
    onOptionsChange({
      ...options,
      mode,
    })
  }

  const builtInModes = [
    {
      key: 'any',
      value: 'any',
      label: 'Past or Present',
      description: 'Student has had a study right at any point in time.',
    },
    {
      key: 'active',
      value: 'active',
      label: 'Active Study Right',
      description: 'Student has a currently active study right.',
    },
  ]

  return (
    <>
      <Dropdown
        multiple
        closeOnChange
        fluid
        name={name}
        onChange={handleChange}
        options={dropdownOptions}
        placeholder="Select Programme"
        search
        selection
        value={selectedProgrammes}
        data-cy="Programme-filter-dropdown"
      />
      <div style={{ marginTop: '0.5em' }}>
        Mode:{' '}
        <Dropdown
          data-cy="Programme-filter-mode-selector"
          compact
          inline
          placeholder="Type"
          value={options.mode ?? 'active'}
          onChange={(_, { value }) => setMode(value)}
          options={[...builtInModes, ...additionalModes].map(mode => ({
            key: mode.key,
            value: mode.key,
            text: mode.label,
            content: (
              <>
                {mode.label}
                {mode.description && (
                  <>
                    <br />
                    <span
                      style={{
                        fontWeight: 'normal',
                        marginTop: '0.4em',
                        color: '#5b5b5b',
                        maxWidth: '13em',
                        whiteSpace: 'normal',
                        display: 'inline-block',
                        fontSize: '0.9em',
                      }}
                    >
                      {mode.description}
                    </span>
                  </>
                )}
              </>
            ),
          }))}
        />
      </div>
    </>
  )
}

const getStudentProgrammes = student => {
  const studyrights = _.get(student, 'studyrights', [])
  const studyrightElements = _.flatMap(studyrights, 'studyright_elements')
  return studyrightElements.filter(element => _.get(element, 'element_detail.type') === 20)
}

const createStudentToProgrammeMap = (students, studyRightPredicate) => {
  const studentProgrammePairs = []

  students.forEach(student => {
    const studentProgrammes = getStudentProgrammes(student)
    if (!studentProgrammes.length)
      studentProgrammePairs.push({ student, programme: { ...NO_PROGRAMME, element_detail: { ...NO_PROGRAMME } } })
    studentProgrammes.forEach(programme => {
      studentProgrammePairs.push({ student, programme })
    })
  })

  const programmes = _.uniqBy(_.map(studentProgrammePairs, 'programme.element_detail'), 'code')

  const studentToProgrammeMap = studentProgrammePairs => {
    const filteredPairs = _.filter(studentProgrammePairs, ({ student, programme }) =>
      studyRightPredicate(student, programme)
    )

    const groupedByStudent = _.groupBy(filteredPairs, 'student.studentNumber')

    return _.mapValues(groupedByStudent, pairs => _.map(pairs, pair => pair.programme.element_detail))
  }

  return { programmes, studentToProgrammeMap: studentToProgrammeMap(studentProgrammePairs) }
}

const MODE_PREDICATES = {
  any: () => true,
  active: (_, sre) => sre.code === NO_PROGRAMME.code || moment().isBetween(sre.startdate, sre.enddate, 'day', '[]'),
}

export const programmeFilter = createFilter({
  key: 'Programme',

  defaultOptions: {
    selectedProgrammes: [],
    mode: 'active',
  },

  precompute: ({ students, options, args }) => {
    let predicate = () => true

    if (args?.studyRightPredicate) {
      predicate = args.studyRightPredicate
    }

    if (options.mode) {
      let modePredicate = MODE_PREDICATES[options.mode]

      const additional = _.get(args, 'additionalModes', []).find(mode => mode.key === options.mode)?.predicate

      if (!modePredicate && additional) {
        modePredicate = additional
      }

      if (modePredicate) {
        const prevPredicate = predicate
        predicate = (student, sre) => prevPredicate(student, sre) && modePredicate(student, sre)
      }
    }

    return createStudentToProgrammeMap(students, predicate)
  },

  isActive: ({ selectedProgrammes }) => selectedProgrammes.length > 0,

  filter({ studentNumber }, { selectedProgrammes }, { precomputed: { studentToProgrammeMap } }) {
    return selectedProgrammes.every(pcode =>
      _.get(studentToProgrammeMap, studentNumber, []).some(({ code }) => code === pcode)
    )
  },

  selectors: {
    isProgrammeSelected: ({ selectedProgrammes }, programme) => selectedProgrammes.includes(programme),
  },

  actions: {
    toggleProgrammeSelection: (options, programme) => {
      const index = options.selectedProgrammes.indexOf(programme)

      if (index === -1) {
        options.selectedProgrammes.push(programme)
      } else {
        options.selectedProgrammes.splice(index, 1)
      }
    },
  },

  render: (props, { precomputed, args }) => (
    <ProgrammeFilterCard
      {...props}
      programmes={precomputed.programmes}
      studentToProgrammeMap={precomputed.studentToProgrammeMap}
      additionalModes={args?.additionalModes ?? []}
      studyRightPredicate={args?.studyRightPredicate ?? (() => true)}
    />
  ),
})

export const { isProgrammeSelected } = programmeFilter.selectors

export const { toggleProgrammeSelection } = programmeFilter.actions
