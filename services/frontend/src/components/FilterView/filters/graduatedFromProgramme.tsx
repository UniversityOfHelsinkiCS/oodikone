import { DegreeProgrammeType } from '@oodikone/shared/types'
import { FilterTrayProps } from '../FilterTray'
import { FilterRadio } from './common/FilterRadio'
import { createFilter } from './createFilter'

const DEFAULT_STATE = '0' as const

const BACHELORS = DegreeProgrammeType.BACHELOR
const MASTERS = DegreeProgrammeType.MASTER
const GRADUATION_PHASE = {
  NOT_GRADUATED: '-1',
  NOT_GRADUATED_BACHELOR: '-1',
  NOT_GRADUATED_MASTER: '-2',

  GRADUATED: '1',
  GRADUATED_BACHELOR: '1',
  GRADUATED_MASTER: '2',
} as const

const GraduatedFromProgrammeFilterCard = ({ args, onOptionsChange }: FilterTrayProps) => {
  const isCombinedExtent = !!args.code && (!!args.combinedProgrammeCode || !!args.showBachelorAndMaster)
  const isLicentiate = args.combinedProgrammeCode === 'MH90_001'

  const typeOfCombined = isLicentiate ? 'Licentiate' : 'Master'
  const modeOptions = isCombinedExtent
    ? [
        { key: 'All', text: 'All', value: DEFAULT_STATE },
        { key: 'graduated-bachelor', text: "Graduated with Bachelor's", value: GRADUATION_PHASE.GRADUATED_BACHELOR },
        {
          key: 'graduated-master',
          text: `Graduated with ${typeOfCombined}'s`,
          value: GRADUATION_PHASE.GRADUATED_MASTER,
        },
        {
          key: 'not-graduated-bachelor',
          text: "Not graduated with Bachelor's",
          value: GRADUATION_PHASE.NOT_GRADUATED_BACHELOR,
        },
        {
          key: 'not-graduated-master',
          text: `Not graduated with ${typeOfCombined}'s`,
          value: GRADUATION_PHASE.NOT_GRADUATED_MASTER,
        },
      ]
    : [
        { key: 'All', text: 'All', value: DEFAULT_STATE },
        { key: 'graduated-true', text: 'Graduated', value: GRADUATION_PHASE.GRADUATED },
        { key: 'graduated-false', text: 'Not graduated', value: GRADUATION_PHASE.NOT_GRADUATED },
      ]

  return (
    <FilterRadio
      defaultValue={DEFAULT_STATE}
      filterKey={graduatedFromProgrammeFilter.key}
      onChange={({ target }) => onOptionsChange({ mode: target.value })}
      options={modeOptions}
    />
  )
}

export const graduatedFromProgrammeFilter = createFilter({
  key: 'graduatedFromProgrammeFilter',

  title: 'Graduated from programme',

  defaultOptions: {
    mode: DEFAULT_STATE,
  },

  isActive: ({ mode }) => mode !== DEFAULT_STATE,

  filter(student, { args, options }) {
    const { code } = args
    const studyRight = student.studyRights.find(sr => sr.studyRightElements.some(el => el.code === code))

    // Cannot determine if student has or has not graduated
    if (!studyRight) return false

    const element = studyRight.studyRightElements.find(el => el.code === code)!

    const { mode } = options
    const isBachelorOrMaster = [BACHELORS, MASTERS].includes(element.degreeProgrammeType)
    const isBachelorMode = [GRADUATION_PHASE.NOT_GRADUATED_BACHELOR, GRADUATION_PHASE.GRADUATED_BACHELOR].includes(mode)
    const isMastersMode = [GRADUATION_PHASE.NOT_GRADUATED_MASTER, GRADUATION_PHASE.GRADUATED_MASTER].includes(mode)

    const keepGraduated = Number(mode) > 0

    if (!isBachelorOrMaster || !args.showBachelorAndMaster) {
      return keepGraduated === !!element?.graduated
    } else if (isBachelorMode) {
      return (
        keepGraduated === studyRight.studyRightElements.some(el => el.graduated && el.degreeProgrammeType === BACHELORS)
      )
    } else if (isMastersMode) {
      return (
        keepGraduated === studyRight.studyRightElements.some(el => el.graduated && el.degreeProgrammeType === MASTERS)
      )
    }

    const hasGraduated = false
    return keepGraduated === hasGraduated
  },

  render: GraduatedFromProgrammeFilterCard,
})
