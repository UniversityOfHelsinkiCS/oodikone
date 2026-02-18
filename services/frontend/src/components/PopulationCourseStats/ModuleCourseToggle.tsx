import { Toggle } from '@/components/common/toggle/Toggle'

export const ModuleCourseToggle = ({
  showModules,
  setShowModules,
}: {
  showModules: boolean
  setShowModules: (input: boolean) => void
}) => {
  return (
    <Toggle
      cypress="module-course-toggle"
      disabled={false}
      firstLabel="Courses"
      infoBoxContent={'Show only courses or modules'}
      secondLabel="Modules"
      setValue={setShowModules}
      value={showModules}
    />
  )
}
