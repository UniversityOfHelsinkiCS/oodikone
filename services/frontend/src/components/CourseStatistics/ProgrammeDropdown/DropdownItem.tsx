import { Label, Popup } from 'semantic-ui-react'

interface DropdownItemProps {
  code: string
  description: string
  name: string
  size: number
}

export const DropdownItem = ({ code, description, name, size }: DropdownItemProps) => (
  <Popup
    content={description}
    disabled={!['ALL', 'OTHER', 'EXCLUDED'].includes(code)}
    size="small"
    trigger={
      <div style={{ display: 'flex' }}>
        <div style={{ flexGrow: 1 }}>
          <Label content={size} icon="user" size="tiny" />
          <span style={{ paddingLeft: '1rem' }}>{name}</span>
        </div>
        <div style={{ flexGrow: 0 }}>
          <Label content={code} size="tiny" />
        </div>
      </div>
    }
  />
)
