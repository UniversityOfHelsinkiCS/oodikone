import { useEffect, useMemo, useRef, useState } from 'react'
import { Accordion } from 'semantic-ui-react'

import { useLocalStorage } from '@/common/hooks'

const titleStyle = { paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }

/*
  Takes in list of objects with properties: title (string), content (jsx), and optionally alwaysRender (boolean)
  e.g.
  [ { title: 'Credit accumulation', content: <>stuff</>, alwaysRender: true }, 
  ... ]
  falsy items are filtered out, so you can leave them in
  Always rendering the panel might be necessary for example when the data needed in the parent component will be fetched inside the panel. Note that rendering doesn't mean that the content is visible, it's just rendered in the DOM.
*/
export const PanelView = ({ panels: initialPanels, viewTitle }) => {
  const refs = useRef([])
  const [activeIndex, setActiveIndex] = useLocalStorage(viewTitle, [0])
  const [newestIndex, setNewestIndex] = useState(null)

  useEffect(() => {
    if (newestIndex) refs.current[newestIndex].scrollIntoView({ behavior: 'smooth', block: 'end' })
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
        .filter(panel => panel)
        .map((panel, index) => ({
          key: `${panel.title}-${index}`,
          onTitleClick: () => togglePanel(index),
          title: {
            content: (
              <span data-cy={panel.title} style={titleStyle}>
                {panel.title}
              </span>
            ),
          },
          content: {
            content: (activeIndex.includes(index) || panel.alwaysRender) && (
              <div
                key={panel.key}
                ref={element => {
                  refs.current[index] = element
                }}
              >
                {panel.content}
              </div>
            ),
          },
        })),
    [initialPanels, activeIndex]
  )

  return <Accordion activeIndex={activeIndex} exclusive={false} fluid panels={panels} styled />
}
