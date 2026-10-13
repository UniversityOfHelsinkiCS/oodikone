import { StyledMessage } from '@/components/common/StyledMessage'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'

const textContent = {
  fi: `Nämä asetukset eivät ole henkilökohtaisia.
 Esimerkiksi kurssin tai moduulin piilottaminen piilottaa sen myös muilta Oodikoneen käyttäjiltä.
 Muutetut asetukset astuvat voimaan vasta sivun uudelleenlatauksen jälkeen.`,
  en: `These settings are not personal.
  For example, hiding a course or a module also hides it from other Oodikone users.
  Reload the page for the changes to take effect.`,
}

export const ManageCoursesShownInfo = () => {
  const { getTextIn } = useLanguage()
  return (
    <StyledMessage showIcon variant="outlined" severity="warning" sx={{ maxWidth: '100%', width: '100%' }}>
      {getTextIn(textContent)}
    </StyledMessage>
  )
}
