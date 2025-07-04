import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { Dropdown, type DropdownProps } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { createFilter } from './createFilter'

dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)

const NO_PROGRAMME = { code: '00000', name: { en: 'No programme', fi: 'Ei ohjelmaa' } }

const ProgrammeFilterCard = ({ additionalModes, onOptionsChange, options, studentToProgrammeMap, students }) => {
  const { getTextIn } = useLanguage()
  const { selectedProgrammes } = options

  // TODO: retype
  const visibleProgrammes: {
    code
    name
    studentCount
  }[] = []
  students.forEach(student => {
    studentToProgrammeMap[student.studentNumber].forEach(programme => {
      const prog = visibleProgrammes.find(prog => prog.code === programme.code)

      if (!prog) {
        visibleProgrammes.push({ ...programme, studentCount: 1 })
      } else prog.studentCount += 1
    })
  })

  const dropdownOptions = visibleProgrammes
    .map(({ code, name, studentCount }) => ({
      key: `programme-filter-value-${code}`,
      text: getTextIn(name) ?? '',
      value: code,
      content: (
        <>
          {getTextIn(name)}
          <br />
          <span style={{ color: '#888', whiteSpace: 'nowrap' }}>
            ({studentCount} student{studentCount !== 1 && 's'})
          </span>
        </>
      ),
    }))
    .sort((a, b) => a.text.localeCompare(b.text))

  const handleChange: NonNullable<DropdownProps['onChange']> = (_, { value }) => {
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
  (student?.studyRights ?? []).flatMap(({ studyRightElements, cancelled }) =>
    studyRightElements.map(element => ({ ...element, cancelled }))
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
    dayjs().isSameOrAfter(studyRightElement.startDate, 'day') &&
    (dayjs().isSameOrBefore(studyRightElement.endDate, 'day') || studyRightElement.endDate == null),
}

export const programmeFilter = createFilter({
  key: 'Programme',

  defaultOptions: {
    selectedProgrammes: [] as string[],
    mode: 'active',
  },

  precompute: ({ students, options, args }) => {
    let predicate = (..._: any[]) => true

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

  filter({ studentNumber }, { precomputed: studentToProgrammeMap, options }) {
    const { selectedProgrammes } = options

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
