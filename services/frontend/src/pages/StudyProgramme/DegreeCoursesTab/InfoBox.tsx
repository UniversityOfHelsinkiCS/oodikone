import { StyledMessage } from '@/components/common/StyledMessage'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'

const textContent = {
  fi: `Nämä asetukset eivät ole henkilökohtaisia.
 Esim. kurssin tai moduulin piilottaminen piilottaa sen myös muilta Oodikoneen käyttäjiltä.`,
  en: `These settings are non-personal.
  Example: hiding a course or a module will also hide it from other Oodikone users.`,
}

export const ManageCoursesShownInfo = () => {
  const { getTextIn } = useLanguage()
  return (
    <StyledMessage showIcon variant="outlined" severity="info" sx={{ mb: 2, maxWidth: '100%' }}>
      {getTextIn(textContent)}
    </StyledMessage>
  )
}
