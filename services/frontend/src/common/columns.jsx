import React from 'react'
import { Popup, Icon } from 'semantic-ui-react'
import { copyToClipboard } from 'common'

export const getCopyableEmailColumn = ({
  popupStates,
  copyToClipboardAll,
  sendAnalytics,
  handlePopupOpen,
  handlePopupClose,
}) => {
  return {
    mergeHeader: true,
    merge: true,
    key: 'email',
    export: false,
    children: [
      {
        key: 'emailValue',
        title: (
          <>
            Email
            <Popup
              trigger={
                <Icon
                  size="large"
                  link
                  name="copy"
                  onClick={copyToClipboardAll}
                  style={{ float: 'right', marginLeft: '0.25em' }}
                  color="grey"
                />
              }
              content="Copied email list!"
              on="click"
              open={popupStates['0']}
              onClose={() => handlePopupClose('0')}
              onOpen={() => handlePopupOpen('0')}
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
        getRowVal: s => s.secondaryEmail,
        getRowContent: s =>
          s.email && !s.obfuscated ? (
            <Popup
              trigger={
                <Icon
                  link
                  name="copy outline"
                  onClick={() => {
                    copyToClipboard(s.email)
                    sendAnalytics("Copy student's email to clipboard", "Copy student's email to clipboard")
                  }}
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
        headerProps: { onClick: null, sorted: null },
        cellProps: { className: 'iconCellNoPointer' },
      },
    ],
  }
}

export const hiddenNameAndEmailForExcel = [
  {
    key: 'hidden-lastname',
    title: 'Last name',
    forceToolsMode: 'none',
    getRowVal: s => s.lastname,
    headerProps: { style: { display: 'none' } },
    cellProps: { style: { display: 'none' } },
    export: true,
  },
  {
    key: 'hidden-firstnames',
    title: 'First names',
    getRowVal: s => s.firstnames,
    forceToolsMode: 'none',
    headerProps: { style: { display: 'none' } },
    cellProps: { style: { display: 'none' } },
    export: true,
  },
  {
    key: 'hidden-email',
    title: 'E-mail',
    getRowVal: s => s.email ?? '',
    forceToolsMode: 'none',
    headerProps: { style: { display: 'none' } },
    cellProps: { style: { display: 'none' } },
    export: true,
  },
  {
    key: 'hidden-secondary-email',
    title: 'Secondary E-mail',
    getRowVal: s => s.secondaryEmail ?? '',
    forceToolsMode: 'none',
    headerProps: { style: { display: 'none' } },
    cellProps: { style: { display: 'none' } },
    export: true,
  },
]
