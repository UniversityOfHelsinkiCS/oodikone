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
        { key: 'graduated-true', text: 'Graduated', value: GRADUATION_PHASE.GRADUATED },
        { key: 'graduated-false', text: 'Not graduated', value: GRADUATION_PHASE.NOT_GRADUATED },
      ]

  return (
    <FilterRadio
      defaultOption={{ key: undefined, text: 'All', value: DEFAULT_STATE }}
      filterKey="graduatedFromProgrammeFilter"
      onChange={({ target }) => onOptionsChange({ mode: target.value })}
      options={modeOptions}
    />
  )
}

export const graduatedFromProgrammeFilter = createFilter({
  key: 'GraduatedFromProgramme',

  title: 'Graduated from programme',

  defaultOptions: {
    mode: DEFAULT_STATE,
  },

  isActive: ({ mode }) => mode !== '0',

  filter(student, { args, options }) {
    const { mode } = options
    const { code, showBachelorAndMaster } = args

    const studyRight = student.studyRights.find(sr => sr.studyRightElements.some(el => el.code === code))
    if (!studyRight) return false

    const element = studyRight.studyRightElements.find(el => el.code === code)!

    const isBachelorOrMaster = [BACHELORS, MASTERS].includes(element.degreeProgrammeType)
    const isBachelorMode = [GRADUATION_PHASE.NOT_GRADUATED_BACHELOR, GRADUATION_PHASE.GRADUATED_BACHELOR].includes(mode)
    const isMastersMode = [GRADUATION_PHASE.NOT_GRADUATED_MASTER, GRADUATION_PHASE.GRADUATED_MASTER].includes(mode)

    let hasGraduated = false

    if (!isBachelorOrMaster || !showBachelorAndMaster) {
      hasGraduated = !!element?.graduated
    } else if (isBachelorMode) {
      hasGraduated = studyRight.studyRightElements.some(el => el.degreeProgrammeType === BACHELORS && el.graduated)
    } else if (isMastersMode) {
      hasGraduated = studyRight.studyRightElements.some(el => el.degreeProgrammeType === MASTERS && el.graduated)
    }

    const keepGraduated = Number(mode) > 0

    return keepGraduated === hasGraduated
  },

  render: GraduatedFromProgrammeFilterCard,
})
