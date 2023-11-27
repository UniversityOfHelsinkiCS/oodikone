import React from 'react'
import { Popup, Icon } from 'semantic-ui-react'

import { StudentInfoItem } from 'components/common/StudentInfoItem'

export const getCopyableStudentNumberColumn = ({
  popupStates,
  copyItemsToClipboard,
  handlePopupOpen,
  handlePopupClose,
  fieldName,
}) => {
  return {
    key: 'studentnumber',
    forceToolsMode: 'dangling',
    textTitle: 'Student number',
    title: (
      <>
        Student number
        <Popup
          trigger={
            <Icon
              size="large"
              link
              name="copy"
              onClick={event => copyItemsToClipboard(event, fieldName)}
              style={{ float: 'right', marginLeft: '0.25em' }}
              color="grey"
              title="Click here to copy all student numbers onto your clipboard"
            />
          }
          content="Copied student numbers!"
          on="click"
          open={popupStates.studentnumbers}
          onClose={() => handlePopupClose('studentnumbers')}
          onOpen={() => handlePopupOpen('studentnumbers')}
          position="top right"
        />
      </>
    ),
    getRowVal: s => (!s.obfuscated ? s.studentNumber : 'hidden'),
    getRowContent: s => <StudentInfoItem student={s} showSisuLink tab="General Tab" />,
  }
}

export const getCopyableEmailColumn = ({
  popupStates,
  copyItemsToClipboard,
  handlePopupOpen,
  handlePopupClose,
  fieldName,
}) => {
  return {
    mergeHeader: true,
    merge: true,
    key: 'email',
    export: false,
    sortable: false,
    children: [
      {
        key: 'emailValue',
        sortable: false,
        title: (
          <>
            Email
            <Popup
              trigger={
                <Icon
                  size="large"
                  link
                  name="copy"
                  onClick={event => copyItemsToClipboard(event, fieldName)}
                  style={{
                    float: 'right',
                    marginLeft: '0.25em',
                  }}
                  color="grey"
                  title="Click here to copy all emails onto your clipboard"
                />
              }
              content="Copied email list!"
              on="click"
              open={popupStates.emails}
              onClose={() => handlePopupClose('emails')}
              onOpen={() => handlePopupOpen('emails')}
              position="top right"
            />
          </>
        ),
        textTitle: 'Email',
        getRowVal: s => s.email,
      },
      {
        key: 'copyEmail',
        textTitle: 'Secondary email',
        sortable: false,
        getRowVal: s => s.secondaryEmail,
        getRowContent: s =>
          s.email && !s.obfuscated ? (
            <Popup
              trigger={
                <Icon
                  link
                  name="copy outline"
                  onClick={() => navigator.clipboard.writeText(s.email)}
                  style={{ float: 'right' }}
                />
              }
              content="Email copied!"
              on="click"
              open={popupStates[s.studentNumber]}
              onClose={() => handlePopupClose(s.studentNumber)}
              onOpen={() => handlePopupOpen(s.studentNumber)}
              position="top right"
            />
          ) : null,
        cellProps: { className: 'iconCellNoPointer' },
      },
    ],
  }
}

export const hiddenNameAndEmailForExcel = [
  {
    key: 'hidden-lastname',
    title: 'Last name',
    getRowVal: s => s.lastname,
    export: true,
  },
  {
    key: 'hidden-firstnames',
    title: 'First names',
    getRowVal: s => s.firstnames,
    export: true,
  },
  {
    key: 'hidden-email',
    title: 'E-mail',
    getRowVal: s => s.email ?? '',
    export: true,
  },
  {
    key: 'hidden-secondary-email',
    title: 'Secondary E-mail',
    getRowVal: s => s.secondaryEmail ?? '',
    export: true,
  },
]
