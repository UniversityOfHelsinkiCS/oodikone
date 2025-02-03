import moment from 'moment'
import { Dropdown } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { createFilter } from './createFilter'

const NO_PROGRAMME = { code: '00000', name: { en: 'No programme', fi: 'Ei ohjelmaa' } }

const ProgrammeFilterCard = ({ additionalModes, onOptionsChange, options, studentToProgrammeMap, withoutSelf }) => {
  const { getTextIn } = useLanguage()
  const { selectedProgrammes } = options

  const visibleProgrammes = withoutSelf().reduce((acc, student) => {
    const studentsProgrammes = studentToProgrammeMap[student.studentNumber]
    for (const programme of studentsProgrammes) {
      const existingProgramme = acc.find(prog => prog.code === programme.code)
      if (existingProgramme) {
        existingProgramme.studentCount += 1
      } else {
        acc.push({ ...programme, studentCount: 1 })
      }
    }
    return acc
  }, [])

  const dropdownOptions = visibleProgrammes
    .map(({ code, name, studentCount }) => ({
      key: `programme-filter-value-${code}`,
      text: getTextIn(name),
      value: code,
      content: (
        <>
          {getTextIn(name)}{' '}
          <span style={{ color: '#888', whiteSpace: 'nowrap' }}>
            ({studentCount} student{studentCount === 1 ? '' : 's'})
          </span>
        </>
      ),
    }))
    .sort((a, b) => a.text.localeCompare(b.text))

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
        name="programmeFilterCard"
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

const getStudentProgrammes = student =>
  (student?.studyRights ?? []).flatMap(studyRight =>
    studyRight.studyRightElements.map(element => ({ ...element, cancelled: studyRight.cancelled }))
  )

const createStudentToProgrammeMap = (students, studyRightPredicate) => {
  const studentToProgrammeMap = {}

  for (const student of students) {
    const studentProgrammes = getStudentProgrammes(student)

    const filteredProgrammes = studentProgrammes.filter(programme => studyRightPredicate(student, programme))

    if (!filteredProgrammes.length) {
      studentToProgrammeMap[student.studentNumber] = [NO_PROGRAMME]
      continue
    }

    studentToProgrammeMap[student.studentNumber] = filteredProgrammes.reduce((acc, { code, name }) => {
      if (acc.some(programme => programme.code === code)) {
        return acc
      }
      acc.push({ code, name })
      return acc
    }, [])
  }

  return studentToProgrammeMap
}

const MODE_PREDICATES = {
  any: () => true,
  active: (_, studyRightElement) =>
    !studyRightElement.cancelled &&
    moment().isSameOrAfter(studyRightElement.startDate, 'day') &&
    (moment().isSameOrBefore(studyRightElement.endDate, 'day') || studyRightElement.endDate == null),
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

      const additional = args?.additionalModes?.find(mode => mode.key === options.mode)?.predicate

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

  filter({ studentNumber }, { selectedProgrammes }, { precomputed: studentToProgrammeMap }) {
    return selectedProgrammes.every(pcode => studentToProgrammeMap[studentNumber].some(({ code }) => code === pcode))
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

  render: (props, { precomputed: studentToProgrammeMap, args }) => (
    <ProgrammeFilterCard
      {...props}
      additionalModes={args?.additionalModes ?? []}
      studentToProgrammeMap={studentToProgrammeMap}
    />
  ),
})

export const { isProgrammeSelected } = programmeFilter.selectors

export const { toggleProgrammeSelection } = programmeFilter.actions
