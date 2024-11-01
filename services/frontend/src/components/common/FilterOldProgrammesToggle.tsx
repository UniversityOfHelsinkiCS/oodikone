import { Radio } from 'semantic-ui-react'

interface FilterOldProgrammesToggleProps {
  checked: boolean
  onChange: () => void
}

export const FilterOldProgrammesToggle = ({ checked, onChange }: FilterOldProgrammesToggleProps) => (
  <Radio checked={checked} label="Filter out old and specialized programmes" onChange={onChange} toggle />
)
