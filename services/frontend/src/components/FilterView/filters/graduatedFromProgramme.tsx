import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'

import { FilterTrayProps } from '../FilterTray'
import { createFilter } from './createFilter'

const GraduatedFromProgrammeFilterCard = ({ args, options, onOptionsChange }: FilterTrayProps) => {
  const isCombinedExtent = !!args.code && (!!args.combinedProgrammeCode || !!args.showBachelorAndMaster)
  const isLicentiate = args.combinedProgrammeCode === 'MH90_001'

  const { mode } = options
  const typeOfCombined = isLicentiate ? 'Licentiate' : 'Master'
  const modeOptions = isCombinedExtent
    ? [
        { key: 'graduated-bachelor', text: "Graduated with Bachelor's", value: 1 },
        { key: 'graduated-master', text: `Graduated with ${typeOfCombined}'s`, value: 2 },
        { key: 'not-graduated-bachelor', text: "Not graduated with Bachelor's", value: 0 },
        { key: 'not-graduated-master', text: `Not graduated with ${typeOfCombined}'s`, value: -1 },
      ]
    : [
        { key: 'graduated-true', text: 'Graduated', value: 1 },
        { key: 'graduated-false', text: 'Not graduated', value: 0 },
      ]

  return (
    <RadioGroup>
      <FormControlLabel
        checked={mode === null}
        control={<Radio />}
        data-cy="option-all"
        label="All"
        onChange={() => onOptionsChange({ mode: null })}
      />
      {modeOptions.map(option => (
        <FormControlLabel
          checked={mode === option.value}
          control={<Radio />}
          data-cy={`option-${option.key}`}
          key={option.key}
          label={option.text}
          onChange={() => onOptionsChange({ mode: option.value })}
        />
      ))}
    </RadioGroup>
  )
}

export const graduatedFromProgrammeFilter = createFilter({
  key: 'GraduatedFromProgramme',

  title: 'Graduated from programme',

  defaultOptions: {
    mode: null,
  },

  isActive: ({ mode }) => mode !== null,

  filter(student, { args, options }) {
    const { mode } = options

    const { code, showBachelorAndMaster } = args
    const BACHELORS = 'urn:code:degree-program-type:bachelors-degree'
    const MASTERS = 'urn:code:degree-program-type:masters-degree'

    const studyRight = student.studyRights.find(sr => sr.studyRightElements.some(el => el.code === code))
    if (!studyRight) return false

    const element = studyRight.studyRightElements.find(el => el.code === code)

    const isBachelorOrMaster = [BACHELORS, MASTERS].includes(element?.degreeProgrammeType)

    let hasGraduated = false

    if (!isBachelorOrMaster || !showBachelorAndMaster) {
      hasGraduated = !!element?.graduated
    } else if ([0, 1].includes(mode)) {
      hasGraduated = studyRight.studyRightElements.some(el => el.degreeProgrammeType === BACHELORS && el.graduated)
    } else if ([2, -1].includes(mode)) {
      hasGraduated = studyRight.studyRightElements.some(el => el.degreeProgrammeType === MASTERS && el.graduated)
    }

    const keepGraduated = mode > 0

    return keepGraduated === hasGraduated
  },

  render: GraduatedFromProgrammeFilterCard,
})
