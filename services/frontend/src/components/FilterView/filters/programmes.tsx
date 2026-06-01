import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import dayjs, { extend as dayjsExtend } from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SISStudyRightElement } from '@oodikone/shared/models'
import { FormattedStudent, Name, Unarray } from '@oodikone/shared/types'
import { FilterSelect } from './common/FilterSelect'
import { createFilter, FilterTrayProps } from './createFilter'

dayjsExtend(isSameOrBefore)
dayjsExtend(isSameOrAfter)

type Options = { selectedProgrammes: string[]; mode: string }
type Args = {
  additionalModes: {
    key: string
    label: string
    predicate: (student: FormattedStudent, studyRightElement: SISStudyRightElement) => boolean
    description: string
  }[]
}
type Precompute = Record<string, { code: string; name: Name }[]>

const ProgrammeFilterCard = ({
  args,
  onOptionsChange,
  options,
  precomputed: studentToProgrammeMap,
  students,
}: FilterTrayProps<Options, Args, Precompute>) => {
  const additionalModes = args?.additionalModes ?? []

  const { getTextIn } = useLanguage()
  const { selectedProgrammes } = options

  const visibleProgrammes: { code: string; name: Name; studentCount: number }[] = []
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
        onChange={({ target }) => onOptionsChange({ ...options, selectedProgrammes: target.value as string[] })}
        options={dropdownOptions}
        sx={{ mb: 2 }}
        value={selectedProgrammes}
      />
      <FilterSelect
        InputItem={value => (
          <Typography fontWeight={500} px={0.5}>
            {modeOptions.find(mode => value === mode.value)!.text}
          </Typography>
        )}
        MenuItem={option => (
          <MenuItem disabled={option.disabled} key={option.key} value={option.value}>
            <Stack>
              <Typography fontWeight={500}>{option.text}</Typography>
              <Typography sx={{ color: '#5b5b5b', fontSize: '0.9em' }}>
                {modes.find(mode => option.key === mode.key)?.description}
              </Typography>
            </Stack>
          </MenuItem>
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

const getStudentProgrammes = (student: FormattedStudent) =>
  (student?.studyRights ?? []).flatMap(({ studyRightElements, cancelled }) =>
    studyRightElements.map(element => ({ ...element, cancelled }))
  )

const NO_PROGRAMME = { code: '00000', name: { en: 'No programme', fi: 'Ei ohjelmaa' } }

const createStudentToProgrammeMap = (students: FormattedStudent[], studyRightPredicate) => {
  const studentToProgrammeMap = {}

  for (const student of students) {
    const studentProgrammes = getStudentProgrammes(student)

    const filteredProgrammes = studentProgrammes.filter(programme => studyRightPredicate(student, programme))

    if (!filteredProgrammes.length) {
      studentToProgrammeMap[student.studentNumber] = [NO_PROGRAMME]
      continue
    }

    studentToProgrammeMap[student.studentNumber] = filteredProgrammes.reduce<{ code: string; name: Name }[]>(
      (acc, { code, name }) => {
        if (acc.some(programme => programme.code === code)) {
          return acc
        }
        acc.push({ code, name })
        return acc
      },
      []
    )
  }

  return studentToProgrammeMap
}

const MODE_PREDICATES = {
  any: () => true,
  active: (_, studyRightElement: Unarray<ReturnType<typeof getStudentProgrammes>>) =>
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
    isProgrammeSelected: ({ selectedProgrammes }, programme: string) => selectedProgrammes.includes(programme),
  },

  actions: {
    toggleProgrammeSelection: (options, programme: string) => {
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
