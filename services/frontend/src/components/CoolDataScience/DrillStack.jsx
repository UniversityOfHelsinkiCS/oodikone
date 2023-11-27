import React, { useMemo } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { Breadcrumb, Icon } from 'semantic-ui-react'
import _ from 'lodash'

import { useLanguage } from 'components/LanguagePicker/useLanguage'

const getP = (a, b) => {
  if (a === 0 || b === 0) return 1
  return a / b
}

export const DrillStack = ({ data, renderCard, historyKey }) => {
  const { getTextIn } = useLanguage()
  const history = useHistory()
  const location = useLocation()

  const rootLabel = getTextIn({
    fi: 'Helsingin Yliopisto',
    en: 'University of Helsinki',
    se: 'Helsingfors Universitet',
  })

  const sortBy = ({ currentValue, previousValue }) => 1 - currentValue / previousValue

  const path = _.get(location.state, historyKey) ?? []

  const breadcrumbSections = useMemo(() => {
    const stack = _.chain(path)
      .reduce(
        ([stack, data], segment) => {
          let content = segment
          let next = null

          if (data) {
            const entry = data.find(({ key }) => key === segment)

            if (entry) {
              content = entry.label
              next = entry.children
            }
          }

          const item = {
            key: segment,
            content,
            link: !!next,
            active: !next,
            onClick: () => {
              history.push(location.pathname, {
                [historyKey]: [...stack.map(({ key }) => key).splice(1), segment],
              })
            },
          }

          return [[...stack, item], next]
        },
        [[], data]
      )
      .value()[0]

    const root = {
      key: '',
      content: rootLabel,
      link: true,
      onClick: () =>
        history.push(location.pathname, {
          [historyKey]: [],
        }),
    }

    return [root, ...stack]
  }, [data, path, history, location])

  const drilledData = useMemo(
    () => _.reduce(path, (data, segment) => (!data ? null : data.find(item => item.key === segment)?.children), data),
    [data, path]
  )

  const pushToDrillStack = segment => {
    history.push(location.pathname, {
      [historyKey]: [...path, segment],
    })
  }

  const popFromDrillStack = () => {
    const newPath = [...path]
    newPath.pop()
    history.push(location.pathname, {
      [historyKey]: newPath,
    })
  }

  const stats = useMemo(() => {
    const orderedAbsDiffs = _.chain(drilledData)
      .map(({ currentValue, previousValue }) =>
        Math.abs(Math.floor((getP(currentValue, previousValue) - 1) * 1000) / 10)
      )
      .orderBy()
      .value()

    const medianDiff = orderedAbsDiffs[Math.round((orderedAbsDiffs.length - 1) / 2)]

    return { medianDiff }
  }, [drilledData])

  return (
    <>
      <div style={{ display: 'flex', marginBottom: '20px', marginRight: '40px', alignItems: 'center' }}>
        <Breadcrumb icon="right angle" sections={breadcrumbSections} size="large" />
        {path.length > 0 && (
          <Icon
            onClick={popFromDrillStack}
            style={{ cursor: 'pointer', color: 'rgba(0,0,0,.28)', marginLeft: '0.4em', marginTop: '-0.17em' }}
            name="arrow left"
          />
        )}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 240px)',
          gridTemplateRows: 'repeat(auto-fill) 20px',
          gridGap: '20px',
          justifyContent: 'center',
        }}
      >
        {_.sortBy(drilledData, sortBy).map(item => {
          const handleClick = () => pushToDrillStack(item.key)

          return renderCard(item, handleClick, stats)
        })}
      </div>
    </>
  )
}
