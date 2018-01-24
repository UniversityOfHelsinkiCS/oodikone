import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Dropdown, Button } from 'semantic-ui-react';

import { displayableDateType } from '../../constants/types';
import styles from './scrollableDateSelector.css';

const getOnClickFn = (bool, fn) => (bool ? fn : undefined);


const ScrollableDateSelector = (props) => {
  const {
    selectedDate, selectorDates, onDateInputChange, onControlLeft, onControlRight
  } = props;

  const selectedIndex = selectorDates.findIndex(value => value.text === selectedDate.text);
  const isFirstIndex = selectedDate.text === selectorDates[0].text;
  const isLastIndex = selectedDate === selectorDates[selectorDates.length - 1];
  const controlFnLeft = getOnClickFn(isFirstIndex, onControlLeft);
  const controlFnRigh = getOnClickFn(isLastIndex, onControlRight);

  return (
    <div>
      <div className={styles.dateSelector}>
        <div
          className={styles.controlIconContainer}
          onClick={controlFnLeft}
          onKeyPress={controlFnLeft}
          role="button"
        >
          <Icon name="chevron left" className={styles.controlIcon} disabled={isFirstIndex} />
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
          onClick={controlFnRigh}
          onKeyPress={controlFnRigh}
          role="button"
        >
          <Icon name="chevron right" className={styles.controlIcon} disabled={isLastIndex} />
        </div>
      </div>
      <div className={styles.dateBrowser}>
        <span className={styles.nextDate}>{!isFirstIndex ? `...${selectorDates[selectedIndex - 1].text}` : ' '}</span>
        <span className={styles.selectedDate}>{selectedDate.text}</span>
        <span className={styles.nextDate}>{!isLastIndex ? `${selectorDates[selectedIndex + 1].text}...` : ' '}</span>
      </div>
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
