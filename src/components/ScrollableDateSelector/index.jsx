import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Dropdown } from 'semantic-ui-react';

import { displayableDateType } from '../../constants/types';
import styles from './scrollableDateSelector.css';

const getOnClickFn = (bool, fn) => (bool ? undefined : fn);

const getDateBrowserContent = (index, selectorDates) => {
  const browserElements = [];
  const dots = '...';

  const previousText = index > 0 ? `${selectorDates[index - 1].text}` : ' ';
  const previousTemp = index > 1 ? `${dots}${previousText}` : previousText;
  browserElements.push(<span key="prev" className={styles.nextDate}>{previousTemp}</span>);

  browserElements.push(<span key="selection" className={styles.selectedDate}>{selectorDates[index].text}</span>);

  const nextText = index < (selectorDates.length - 1) ? `${selectorDates[index + 1].text}` : ' ';
  const nextTemp = index < (selectorDates.length - 2) ? `${nextText}${dots}` : nextText;
  browserElements.push(<span key="next" className={styles.nextDate}>{nextTemp}</span>);

  return (
    <div className={styles.dateBrowser}>
      {browserElements}
    </div>
  );
};

const ScrollableDateSelector = (props) => {
  const {
    selectedDate, selectorDates, onDateInputChange, onControlLeft, onControlRight
  } = props;

  if (selectorDates.length === 0) {
    return null;
  }

  const selectedIndex = selectorDates.findIndex(value => value.text === selectedDate.text);
  const isFirstIndex = selectedIndex === 0;
  const isLastIndex = selectedIndex === selectorDates.length - 1;
  const controlFnLeft = getOnClickFn(isFirstIndex, onControlLeft);
  const controlFnRight = getOnClickFn(isLastIndex, onControlRight);

  return (
    <div>
      <div className={styles.dateSelector}>
        <div
          className={styles.controlIconContainer}
          onClick={controlFnLeft}
        >
          <Icon
            name="chevron left"
            className={styles.controlIcon}
            disabled={isFirstIndex}
          />
        </div>
        <Dropdown
          text={selectedDate.text}
          className={styles.controlDropdown}
          value={selectedDate.value}
          options={selectorDates}
          onChange={onDateInputChange}
          scrolling
        />
        <div
          className={styles.controlIconContainer}
          onClick={controlFnRight}
        >
          <Icon
            name="chevron right"
            className={styles.controlIcon}
            disabled={isLastIndex}
          />
        </div>
      </div>
      { getDateBrowserContent(selectedIndex, selectorDates) }
    </div>
  );
};

const { arrayOf, func } = PropTypes;

ScrollableDateSelector.propTypes = {
  selectedDate: displayableDateType.isRequired,
  selectorDates: arrayOf(displayableDateType).isRequired,
  onDateInputChange: func.isRequired,
  onControlLeft: func.isRequired,
  onControlRight: func.isRequired
};

export default ScrollableDateSelector;
