import { chain, get } from 'lodash'
import fp from 'lodash/fp'
import moment from 'moment'
import { useMemo } from 'react'
import { Dropdown } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { createFilter } from './createFilter'

const NO_PROGRAMME = {
  code: '00000',
  name: { en: 'No programme', fi: 'Ei ohjelmaa' },
  startdate: '',
}

const ProgrammeFilterCard = ({
  additionalModes,
  onOptionsChange,
  options,
  programmes,
  studentToProgrammeMap,
  studyRightPredicate,
  withoutSelf,
}) => {
  const { getTextIn } = useLanguage()
  const { selectedProgrammes } = options
  const name = 'programmeFilterCard'

  const visibleProgrammes = fp.flow(
    fp.flatMap(student =>
      get(studentToProgrammeMap, student.studentNumber, []).map(programme => ({ student, programme }))
    ),
    fp.groupBy('student.studentNumber'),
    fp.pickBy(fp.some(({ programme }) => options.selectedProgrammes.every(pcode => programme.code === pcode))),
    fp.values,
    fp.flatten,
    fp.filter(({ student, programme }) => studyRightPredicate(student, programme)),
    fp.map('programme'),
    fp.reduce((acc, details) => {
      if (!acc[details.code]) {
        acc[details.code] = { ...details, studentCount: 0 }
      }
      acc[details.code].studentCount += 1
      return acc
    }, {}),
    fp.values
  )(withoutSelf())

  const dropdownOptions = useMemo(
    () =>
      chain(visibleProgrammes)
        .concat(selectedProgrammes.map(code => programmes.find(programme => programme && programme.code === code)))
        .map(programme => {
          const code = programme?.code ?? NO_PROGRAMME.code
          const name = programme?.name ?? NO_PROGRAMME.name
          const studentCount = programme?.studentCount ?? -1
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
        closeOnChange
        data-cy="Programme-filter-dropdown"
        fluid
        multiple
        name={name}
        onChange={handleChange}
        options={dropdownOptions}
        placeholder="Select programme"
        search
        selection
        value={selectedProgrammes}
      />
      <div style={{ marginTop: '0.5em' }}>
        Mode:{' '}
        <Dropdown
          compact
          data-cy="Programme-filter-mode-selector"
          inline
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
          placeholder="Type"
          value={options.mode ?? 'active'}
        />
      </div>
    </>
  )
}

const getStudentProgrammes = fp.flow(
  fp.get('studyrights'),
  fp.flatMap('studyright_elements'),
  fp.filter(['element_detail.type', 20])
)

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

  const programmes = fp.flow(fp.map('programme.element_detail'), fp.uniqBy('code'))(studentProgrammePairs)

  const studentToProgrammeMap = fp.flow(
    fp.filter(({ student, programme }) => studyRightPredicate(student, programme)),
    fp.groupBy('student.studentNumber'),
    fp.mapValues(fp.map('programme.element_detail'))
  )(studentProgrammePairs)

  return { programmes, studentToProgrammeMap }
}

const MODE_PREDICATES = {
  any: () => true,
  active: (_, studyrightElement) =>
    studyrightElement.code === NO_PROGRAMME.code ||
    moment().isBetween(studyrightElement.startdate, studyrightElement.enddate, 'day', '[]'),
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

      const additional = get(args, 'additionalModes', []).find(mode => mode.key === options.mode)?.predicate

      if (!modePredicate && additional) {
        modePredicate = additional
      }

      if (modePredicate) {
        const prevPredicate = predicate
        predicate = (student, studyrightElement) =>
          prevPredicate(student, studyrightElement) && modePredicate(student, studyrightElement)
      }
    }

    return createStudentToProgrammeMap(students, predicate)
  },

  isActive: ({ selectedProgrammes }) => selectedProgrammes.length > 0,

  filter({ studentNumber }, { selectedProgrammes }, { precomputed: { studentToProgrammeMap } }) {
    return selectedProgrammes.every(pcode =>
      get(studentToProgrammeMap, studentNumber, []).some(({ code }) => code === pcode)
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
      additionalModes={args?.additionalModes ?? []}
      programmes={precomputed.programmes}
      studentToProgrammeMap={precomputed.studentToProgrammeMap}
      studyRightPredicate={args?.studyRightPredicate ?? (() => true)}
    />
  ),
})

export const { isProgrammeSelected } = programmeFilter.selectors

export const { toggleProgrammeSelection } = programmeFilter.actions
