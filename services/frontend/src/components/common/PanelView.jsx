import { useLocalStorage } from 'common/hooks'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import reactScrollToComponent from 'react-scroll-to-component'
import { Accordion } from 'semantic-ui-react'

const titleStyle = { paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }

/*
  Takes in list of objects with properties: title (string), content (jsx)
  e.g.
  [ { title: 'Credit accumulation', content: <>stuff</> }, 
  ... ]
  falsy items are filtered out, so you can leave them in
*/
export const PanelView = ({ panels: initialPanels, viewTitle }) => {
  const refs = useRef([])
  const [activeIndex, setActiveIndex] = useLocalStorage(viewTitle, [0])
  const [newestIndex, setNewestIndex] = useState(null)

  useEffect(() => {
    if (newestIndex) reactScrollToComponent(refs.current[newestIndex], { align: 'bottom' })
  }, [newestIndex])

  const togglePanel = index => {
    const currentActiveIndex = new Set(activeIndex)
    if (currentActiveIndex.has(index)) {
      currentActiveIndex.delete(index)
    } else {
      currentActiveIndex.add(index)
      setNewestIndex(index)
    }
    setActiveIndex([...currentActiveIndex])
  }

  const panels = useMemo(
    () =>
      initialPanels
        .filter(p => p)
        .map((p, i) => ({
          key: `${p.title}-${i}`,
          onTitleClick: () => togglePanel(i),
          title: {
            content: (
              <span style={titleStyle} data-cy={p.title}>
                {p.title}
              </span>
            ),
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
