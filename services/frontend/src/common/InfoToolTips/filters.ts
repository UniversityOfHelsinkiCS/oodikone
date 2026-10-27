export const filterToolTips = {
  citizenship: {
    fi: 'Rajaa opiskelijoita kansalaisuuden perusteella. Tulokseen sisältyvät opiskelijat, joilla on valitun valtion kansalaisuus, riippumatta siitä, onko heillä myös muita kansalaisuuksia.',
    en: 'Filters students based on their citizenship. If a student has multiple citizenships, they are included if one of them matches the filter.',
  },
  courseCredits: {
    fi: `Rajaa opiskelijoiden **kurssisuorituksia ja ilmoittautumisia** määritetyn ajanjakson mukaan.
Huom! ilmoittautumiset voivat tapahtua huomattavasti kurssisuorituksia aikaisemmin.

Suodattaa opiskelijoiden kurssisuorituksia ja ilmoittautumisia. **Ei vaikuta opiskelijoiden lukumäärään.**`,
    en: `Filters students' **course attainments and enrollments** by the provided time range. Note: the enrollments may occur way earlier than the attainments.

Only filters the students' attainments and enrollments. **Does not change the amount of students.**`,
  },
  curriculumPeriod: {
    fi: `Suodattaa opiskelijoita opintosuunnitelmaan valitun tutkinto-ohjelman version mukaan. Jos opiskelijalla ei ole opintosuunnitelmaa, arvo on suodattimessa "None".`,
    en: `Filters students based on the Degree programme version chosen in their study plan. If a student has no study plan, the value in this filter will be "None".`,
  },
  enrollmentStatus: {
    fi: `Suodattaa opiskelijoita sen mukaan, ovatko he ilmoittautuneet **läsnäolevaksi** (present), **poissaolevaksi** (absent) vai **laiminlyöneet ilmoittautumisen** (passive) valituille lukukausille. Jos lukukausia on valittuna enemmän kuin yksi, opiskelijan ilmoittautumisen tulee täsmätä jokaisella valitulla lukukaudella. Jos opiskelijan opinto-oikeus ei ole ollut voimassa valitun lukukauden aikana, häntä ei lasketa mukaan mihinkään kategoriaan.

Huomioi myös, että osa ilmoittautumisen laiminlyöneistä opiskelijoista on saattanut valmistua valitusta ohjelmasta. Valmistuneet opiskelijat voi suodattaa pois "Graduated"-suodattimella.`,
    en: `Filters students based on their enrollment (present, absent, passive) for the chosen semesters. If selecting multiple semesters, the students' enrollments have to match each chosen semester. If a student's study right has not been active during a selected semester, they are not included in any category.

Please note that some of the students with passive study rights may have already graduated from the degree programme. Graduated students may be excluded using the "Graduated" filter.`,
  },
  hetu: {
    fi: 'Rajaa opiskelijoita sen mukaan onko heillä suomalaista henkilötunnusta.',
    en: 'Filters students based on if they have a Finnish personal identity code.',
  },
  startingYear: {
    fi: 'Suodattaa opiskelijoita sen mukaan, minä vuonna heidän ensimmäinen opinto-oikeutensa yliopistolla alkoi (ei siis ainoastaan tarkasteltavan tutkinnon oikeus). Avoimia opinto-oikeuksia ei oteta huomioon.',
    en: 'Filters students based on the year their first study right at the university began (may be earlier than the study right of the current degree programme for students with many study rights). Open university study rights are ignored.',
  },
  studentNumber: {
    fi: `Suodattaa opiskelijoita pois tilastoista (excluded student numbers) tai näyttää vain määritellyt opiskelijat (allowed student numbers). Opiskelijanumeroita, joita ei löydy populaatiosta, ei huomioida.

Suodattimelle voi syöttää myös listan opiskelijanumeroita eroteltuna pilkulla, puolipisteellä, välilyönnillä tai rivinvaihdolla.`,
    en: `Filters students out of the statistics (excluded student numbers), or shows only the selected students (allowed student numbers). Student numbers not found in the population are ignored.

The filter also accepts a list of student numbers. Accepted separators are a comma, a semicolon, a space or a newline.`,
  },
  studyRightStatus: {
    fi: `
Opiskeluoikeus on **aktiivinen** (active), jos opiskelija on ilmoittautunut läsnä- tai poissaolevaksi käynnissä olevalle lukukaudelle.

Opiskeluoikeus on **passiivinen** (passive), jos opiskelija ei ole ilmoittautunut läsnä- eikä poissaolevaksi käynnissä olevalle lukukaudelle.

Lukukausi-ilmoittautumisissa huomioidaan vain se opiskeluoikeus, joka liittyy tarkasteltavaan koulutusohjelmaan. Valmistuneet opiskelijat on **suodatettu pois** molemmista kategorioista.
`,
    en: `A study right is **active**, if a student has enrolled as either present or absent for the ongoing semester.

A study right is **passive**, if a student has not enrolled as present or absent for the ongoing semester.

Only the study right associated with the current degree programme is checked. Graduated students are **filtered out** of both categories.`,
  },
  transferred: {
    fi: `Suodattaa opiskelijat, jotka ovat siirtyneet tarkasteltavaan tutkinto-ohjelmaan. Siirtyneitä opiskelijoita ei oletusarvoisesti näytetä Class statistics -näkymässä.`,
    en: `Filters students who have transferred to the current degree programme. Transferred students are by default not shown in the 'Class statistics' -view.`,
  },
}
