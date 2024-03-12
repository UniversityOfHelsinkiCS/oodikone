import React from 'react'
import { Popup, Icon } from 'semantic-ui-react'

import { StudentInfoItem } from '@/components/common/StudentInfoItem'

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
          content="Copied student numbers!"
          on="click"
          onClose={() => handlePopupClose('studentnumbers')}
          onOpen={() => handlePopupOpen('studentnumbers')}
          open={popupStates.studentnumbers}
          position="top right"
          trigger={
            <Icon
              color="grey"
              link
              name="copy"
              onClick={event => copyItemsToClipboard(event, fieldName)}
              size="large"
              style={{ float: 'right', marginLeft: '0.25em' }}
              title="Click here to copy all student numbers onto your clipboard"
            />
          }
        />
      </>
    ),
    getRowVal: s => (!s.obfuscated ? s.studentNumber : 'hidden'),
    getRowContent: s => <StudentInfoItem showSisuLink student={s} tab="General Tab" />,
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
              content="Copied email list!"
              on="click"
              onClose={() => handlePopupClose('emails')}
              onOpen={() => handlePopupOpen('emails')}
              open={popupStates.emails}
              position="top right"
              trigger={
                <Icon
                  color="grey"
                  link
                  name="copy"
                  onClick={event => copyItemsToClipboard(event, fieldName)}
                  size="large"
                  style={{
                    float: 'right',
                    marginLeft: '0.25em',
                  }}
                  title="Click here to copy all emails onto your clipboard"
                />
              }
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
              content="Email copied!"
              on="click"
              onClose={() => handlePopupClose(s.studentNumber)}
              onOpen={() => handlePopupOpen(s.studentNumber)}
              open={popupStates[s.studentNumber]}
              position="top right"
              trigger={
                <Icon
                  link
                  name="copy outline"
                  onClick={() => navigator.clipboard.writeText(s.email)}
                  style={{ float: 'right' }}
                />
              }
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
