export const filterToolTips = {
  enrollmentStatus: {
    label: 'Filter students present, absent or passive',
    short:
      'Suodata opiskelijoita sen mukaan ovatko he joko ilmoittautuneet läsnä- tai poissaoleviksi tai jääneet passiivisiksi kyseiselle lukukaudelle. Huom. osa passiivisista opiskelijoista on jo valmistunut ko. ohjelmasta.',
  },
  studyRightStatus: {
    label: 'Rajaa opiskelijoita opiskeluoikeuden statuksen mukaan',
    short: `
  Opiskeluoikeus on **aktiivinen** (active), jos opiskelija on ilmoittautunut läsnä- tai poissaolevaksi käynnissä olevalle lukukaudelle.

  Opiskeluoikeus on **passiivinen** (inactive), jos opiskelija ei ole ilmoittautunut läsnä- eikä poissaolevaksi käynnissä olevalle lukukaudelle.  

  Lukukausi-ilmoittautumisissa huomioidaan vain se opiskeluoikeus, joka liittyy tarkasteltavaan koulutusohjelmaan. Valmistuneet opiskelijat on **suodatettu pois** molemmista kategorioista.`,
  },
  transferred: {
    label: 'Include and exclude students from this program',
    short:
      'Mahdollisuus suodattaa opiskelijat, jotka ovat siirtyneet nykyiseen 2017 alkaneeseen tutkinto-ohjelmaan vanhasta tutkinto-ohjelmasta',
  },
  courseCredits: {
    label: null,
    short: 'Rajaa kurssisuorituksia tietyn ajanjakson mukaan. Tämä rajaus ei muuta opiskelijoiden määrää',
  },
  studentNumber: {
    label: null,
    short:
      'Rajaa yksittäisiä opiskelijoita pois tilastoista (blocklist) tai näytä vain määritellyt opiskelijat (allowlist). Vain täsmälliset opiskelijanumerot toimivat.',
  },
  startingYear: {
    label: null,
    short:
      'Valitse opiskelijoita sen mukaan, minä vuonna heidän ensimmäinen opinto-oikeutensa yliopistolla alkoi (ei siis ainoastaan tarkasteltavan tutkinnon oikeus). Avoimia opinto-oikeuksia ei oteta huomioon.',
  },
}
