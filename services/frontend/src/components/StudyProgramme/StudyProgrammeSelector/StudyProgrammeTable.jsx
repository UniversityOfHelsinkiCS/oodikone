import { Header } from 'semantic-ui-react'

import { SortableTable } from '@/components/SortableTable'

export const StudyProgrammeTable = ({ header, headers, programmes, visible = true }) => {
  if (!visible || programmes == null || programmes.length === 0) return null

  return (
    <>
      <Header>{header}</Header>
      <SortableTable columns={headers} data={programmes} hideHeaderBar stretch />
    </>
  )
}
