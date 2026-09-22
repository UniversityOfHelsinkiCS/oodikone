import { StyledMessage } from '@/components/common/StyledMessage'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'

const textContent = {
  fi: `Nämä asetukset eivät ole henkilökohtaisia.
 Esim. kurssin tai moduulin piilottaminen piilottaa sen myös muilta Oodikoneen käyttäjiltä.
 Muutetut asetukset astuvat voimaan sivun uudelleenlatauksen jälkeen.`,
  en: `These settings are non-personal.
  Example: hiding a course or a module will also hide it from other Oodikone users.
  Changed settings will require a page reload to take effect.`,
}

export const ManageCoursesShownInfo = () => {
  const { getTextIn } = useLanguage()
  return (
    <StyledMessage showIcon variant="outlined" severity="warning" sx={{ mb: 2, maxWidth: '100%' }}>
      {getTextIn(textContent)}
    </StyledMessage>
  )
}
