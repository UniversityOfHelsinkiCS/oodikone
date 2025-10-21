export const handleClipboardCopy = async (event, items, text, setNotification, closeNotification) => {
  event.stopPropagation()
  await navigator.clipboard.writeText(items.join('\n'))
  setNotification(text)
  setTimeout(() => closeNotification(), 5000)
}
