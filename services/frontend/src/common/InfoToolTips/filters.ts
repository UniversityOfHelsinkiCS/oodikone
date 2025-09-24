export const filterToolTips = {
  citizenship:
    'Rajaa opiskelijoita kansalaisuuden perusteella. Tulokseen sisältyvät opiskelijat, joilla on valitun valtion kansalaisuus, riippumatta siitä, onko heillä myös muita kansalaisuuksia.',
  courseCredits: 'Rajaa kurssisuorituksia tietyn ajanjakson mukaan. Tämä rajaus ei muuta opiskelijoiden määrää',
  enrollmentStatus: `
    Suodata opiskelijoita sen mukaan, ovatko he ilmoittautuneet **läsnäolevaksi** (present), **poissaolevaksi** (absent) vai **laiminlyöneet ilmoittautumisen** (passive) valituille lukukausille. Jos lukukausia on valittuna enemmän kuin yksi, opiskelijan ilmoittautumisen tulee täsmätä jokaisella valitulla lukukaudella.

    Jos opiskelijan opinto-oikeus ei ole ollut voimassa valitun lukukauden aikana, häntä ei lasketa mukaan mihinkään kategoriaan. Huomioi myös, että osa ilmoittautumisen laiminlyöneistä opiskelijoista on saattanut valmistua valitusta ohjelmasta.
  `,
  startingYear:
    'Valitse opiskelijoita sen mukaan, minä vuonna heidän ensimmäinen opinto-oikeutensa yliopistolla alkoi (ei siis ainoastaan tarkasteltavan tutkinnon oikeus). Avoimia opinto-oikeuksia ei oteta huomioon.',
  studentNumber:
    'Rajaa yksittäisiä opiskelijoita pois tilastoista (excluded student numbers) tai näytä **vain** määritellyt opiskelijat (allowed student numbers). Vain täsmälliset tarkasteltavan populaation joukosta löytyvät opiskelijanumerot toimivat. Suodatin tukee useamman opiskelijanumeron syöttämistä kerrallaan.',
  studyRightStatus: `
    Opiskeluoikeus on **aktiivinen** (active), jos opiskelija on ilmoittautunut läsnä- tai poissaolevaksi käynnissä olevalle lukukaudelle.

    Opiskeluoikeus on **passiivinen** (inactive), jos opiskelija ei ole ilmoittautunut läsnä- eikä poissaolevaksi käynnissä olevalle lukukaudelle.

    Lukukausi-ilmoittautumisissa huomioidaan vain se opiskeluoikeus, joka liittyy tarkasteltavaan koulutusohjelmaan. Valmistuneet opiskelijat on **suodatettu pois** molemmista kategorioista.
  `,
  transferred:
    'Mahdollisuus suodattaa opiskelijat, jotka ovat siirtyneet nykyiseen 2017 alkaneeseen tutkinto-ohjelmaan vanhasta tutkinto-ohjelmasta. Oletusarvoisesti pois päältä Class statistics -näkymässä.',
}
