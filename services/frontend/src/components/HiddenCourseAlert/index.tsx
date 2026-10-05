import { StyledMessage } from '@/components/common/StyledMessage'
import { getHiddenCourseCodes, getHiddenModuleCodes } from '@/components/HiddenCourseAlert/util'
import { useCurriculum } from '@/hooks/useCurriculum'
import Tooltip from '@mui/material/Tooltip'

/**
 * Displays if course visibility is modified in the degree programme settings
 */
export const HiddenCourseAlert = ({
  ooditable,
  modules,
}: {
  /** aligns to the right edge in toolbar */
  ooditable?: true
  /** show only modules whose courses are all hidden */
  modules?: true
}) => {
  const { curriculum } = useCurriculum()

  const curriculumCourses = curriculum
    ? [...curriculum.defaultProgrammeCourses, ...curriculum.secondProgrammeCourses]
    : []

  const hiddenCodes = modules ? getHiddenModuleCodes(curriculumCourses) : getHiddenCourseCodes(curriculumCourses)

  const count = hiddenCodes.length

  if (!count) return null

  const [singular, plural] = modules ? ['module', 'modules'] : ['course', 'courses']
  const alertText = `${count} ${count > 1 ? plural : singular} hidden`
  const tooltipText = `${hiddenCodes.slice(0, Math.min(count, 10)).join(', ')} ${count > 10 ? '+ ' + (count - 10).toString() + ' others' : ''}`

  return (
    <Tooltip title={tooltipText}>
      <span style={ooditable ? { marginLeft: 'auto' } : {}}>
        <StyledMessage showIcon severity="warning" sx={{ py: 0, px: 1, m: 0 }}>
          {alertText}
        </StyledMessage>
      </span>
    </Tooltip>
  )
}
