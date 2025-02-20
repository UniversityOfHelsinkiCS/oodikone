import { Radio } from 'semantic-ui-react'

export const FilterOldProgrammesToggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <Radio checked={checked} label="Filter out old and specialized programmes" onChange={onChange} toggle />
)
