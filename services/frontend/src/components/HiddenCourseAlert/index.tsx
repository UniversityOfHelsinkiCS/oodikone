import { StyledMessage } from '@/components/common/StyledMessage'
import { useCurriculum } from '@/hooks/useCurriculum'
import Tooltip from '@mui/material/Tooltip'

/**
 * Displays if course visibility is modified in the degree programme settings
 */
export const HiddenCourseAlert = ({
  ooditable,
}: {
  /** aligns to the right edge in toolbar */
  ooditable?: true
}) => {
  const { curriculum } = useCurriculum()

  const hiddenCourseCodes = (
    curriculum ? [...curriculum.defaultProgrammeCourses, ...curriculum.secondProgrammeCourses] : []
  )
    .filter(course => course.visible.visibility === false)
    .map(course => course.code)

  const count = hiddenCourseCodes.length

  if (!count) return null

  const alertText = `${count} ${count > 1 ? 'courses' : 'course'} hidden`
  const tooltipText = `${hiddenCourseCodes.slice(0, Math.min(count, 10)).join(', ')} ${count > 10 ? '+ ' + (count - 10).toString() + ' others' : ''}`

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
