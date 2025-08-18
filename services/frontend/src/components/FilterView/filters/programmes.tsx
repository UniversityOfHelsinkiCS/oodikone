import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import dayjs, { extend as dayjsExtend } from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { FilterTrayProps } from '../FilterTray'
import { FilterSelect } from './common/FilterSelect'
import { createFilter } from './createFilter'

dayjsExtend(isSameOrBefore)
dayjsExtend(isSameOrAfter)

const NO_PROGRAMME = { code: '00000', name: { en: 'No programme', fi: 'Ei ohjelmaa' } }

const SelectInputItem = ({ text }) => (
  <Typography fontWeight={500} px={0.5}>
    {text}
  </Typography>
)

const CourseMenuStack = ({ disabled, text, value, description }) => (
  <MenuItem disabled={disabled} value={value}>
    <Stack>
      <Typography fontWeight={500}>{text}</Typography>
      <Typography sx={{ color: '#5b5b5b', fontSize: '0.9em' }}>{description}</Typography>
    </Stack>
  </MenuItem>
)

const ProgrammeFilterCard = ({
  args,
  onOptionsChange,
  options,
  precomputed: studentToProgrammeMap,
  students,
}: FilterTrayProps) => {
  const additionalModes = args?.additionalModes ?? []

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

  const modes = [...builtInModes, ...additionalModes]
  const modeOptions = modes.map(mode => ({
    key: mode.key,
    value: mode.key,
    text: mode.label,
  }))

  // TODO: Add infobox
  return (
    <>
      <FilterSelect
        filterKey="programmeFilter"
        label="Select programme"
        multiple
        onChange={({ target }) => onOptionsChange({ ...options, selectedProgrammes: target.value })}
        options={dropdownOptions}
        value={selectedProgrammes}
      />
      <FilterSelect
        InputItem={value => <SelectInputItem text={modeOptions.find(mode => value === mode.value)!.text} />}
        MenuItem={option => (
          <CourseMenuStack
            description={modes.find(mode => option.key === mode.key)?.description}
            disabled={option.disabled}
            key={option.key}
            text={option.text}
            value={option.value}
          />
        )}
        filterKey="programmeFilter-mode"
        label="Select Mode"
        onChange={({ target }) => onOptionsChange({ ...options, mode: target.value })}
        options={modeOptions}
        value={options.mode}
      />
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
  key: 'programmeFilter',

  title: 'Programme',

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

      return options
    },
  },

  render: ProgrammeFilterCard,
})

export const { isProgrammeSelected } = programmeFilter.selectors

export const { toggleProgrammeSelection } = programmeFilter.actions
