import { useLocalStorage } from 'common/hooks'
import React, { useMemo, useRef } from 'react'
import { Accordion } from 'semantic-ui-react'

const titleStyle = { paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }

/*
  Takes in list of objects with properties: title (string), content (jsx)
  e.g.
  [ { title: 'Credit accumulation', content: <>stuff</> }, 
  ... ]
*/
const PanelView = ({ panels: initialPanels, viewTitle }) => {
  const refs = useRef([])
  const [activeIndex, setActiveIndex] = useLocalStorage(viewTitle, [])

  const handleClick = index => {
    const indexes = [...activeIndex].sort()
    if (indexes.includes(index)) {
      indexes.splice(
        indexes.findIndex(ind => ind === index),
        1
      )
    } else {
      indexes.push(index)
    }
    setActiveIndex([...indexes])
  }

  const panels = useMemo(
    () =>
      initialPanels.map((p, i) => ({
        key: `${p.title}-${i}`,
        onTitleClick: () => handleClick(i),
        title: {
          content: <span style={titleStyle}>{p.title}</span>,
        },
        content: {
          content: (
            <div
              key={p.key}
              ref={e => {
                refs.current[i] = e
              }}
            >
              {p.content}
            </div>
          ),
        },
      })),
    [initialPanels, activeIndex]
  )

  return <Accordion activeIndex={activeIndex} exclusive={false} styled fluid panels={panels} />
}

export default PanelView
