export const Setting = ({ children, labelText }) => {
  return (
    <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
      <label style={{ marginBottom: '10px' }}>{labelText}</label>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '60px',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </div>
  )
}
