import { Theme } from '@mui/material/styles'
import { default as ReactDOMServer } from 'react-dom/server'

import { CheckIcon, CropSquareIcon, RemoveIcon } from '@/theme'

const iconToSvg = (Icon, color?) =>
  ReactDOMServer.renderToStaticMarkup(
    <span style={{ display: 'inline-block', color }}>
      <Icon style={{ height: '16px', width: '16px', fill: 'currentColor' }} />
    </span>
  )

export const populationStudentsToolTips = {
  generalTab: {
    associatedProgramme:
      'Programme associated with the attainment or enrollment. View **programme distribution** above for more details.',
    primaryProgramme:
      'Programme associated with the most recently acquired active study right. Columns showing degree programme specific data (e.g. Started in programme or Credits in HOPS) refer to the programme displayed here.',
    programmeStatus:
      'Shows the status of the studyright associated with the corresponding programme. Status is active only if an active semester enrollment for the ongoing semester exists.',
    beforeStarting: `
Credits and courses that
1. were attained before starting in the current programme
2. were either completed or transferred
3. are included in the primary study plan for the programme
`,
    startDates: `
**University**: First degree-leading study right granted in the University
**Study right\\***: Study right associated with current programme
**Programme\\***: Start date in the current programme

\\* if applicable`,
    studyTimeMonths: `
Time passed since starting in the programme until graduation, excluding allowed absences (unlimited statutory and 2 non-statutory absences). Each unique calendar month increments the amount.

**Example:**  
from 31st of January to 1st of March = 3 months  
from 1st of January to 30th of March = 3 months`,
    programmes:
      'If a student has more than one programme, hover your mouse on the cell to view the rest. They are also displayed in the exported Excel file.',
    mostRecentAttainment: 'Date of the most recent course completion that is included in the HOPS',
    tvex: 'Student is enrolled to a bilingual programme (kaksikielinen tutkinto, tvåspråkig examen)',
  },

  studentsClass: (theme: Theme) => `
**Students**

Taulukko näyttää oletusarvoisesti vain opiskelijanumerot. Valitsemalla "Show student names" saat näkyviin myös opiskelijoiden nimet.

Klikkaamalla opiskelijanumeron vieressä olevaa sinistä henkilösymbolia, siirryt kyseisen opiskelijan "Student statistics" -näkymään.

Klikkaamalla "Sisu"-kuvaketta, siirryt tarkastelemaan opiskelijan tietoja Sisu-järjestelmässä.

**General**

Valikoituja selvennyksiä: 
- **Credits**
  - **All**: opiskelijan suoritetut opintopisteet valitun tarkastelujakson ajalta
  - **HOPS**: opiskelijan kaikki HOPSiin sijoitut opintopisteet (myös aiemmat suoritukset, eli ne jotka tehty ennen valittuun tarkastelujaksoon ja populaatioon kuulumista)
  - **Since start in programme**: opiskelijan ohjelmassa aloittamisen jälkeen suoritut opintopisteet
- **Transferred from**: Opiskelijan vanha koulutusohjelma, josta opiskelija on siirtynyt uuteen.
- **Start of study right**: Opiskelijan valittuun ohjelmaan liittyvän opinto-oikeuden alkupäivä
- **Started in programme**: Opiskelijan ko. ohjelmassa aloituspäivämäärä. Kandi+maisteriopiskelijoille kandiksi valmistumispäivämäärä +1
- **Semesters present**: Näyttää opiskelijan ilmoittautumiset lukukausittain. Laita hiiri solun yläpuolelle nähdäksesi tekstimuotoisen selityksen ilmoittautumisista.
  - Värikoodit:
    - Vihreä = Läsnäoleva
    - Keltainen = Ilmoittautunut poissaolevaksi
    - Punainen = Ei ilmoittautumista, mutta opiskelijalla on ollut opinto-oikeus
    - Harmaa = Opiskelijalla ei ollut tällöin opinto-oikeutta
    - Kruunu kertoo opiskelijan valmistuneen kyseisenä lukukautena. Jos näkymässä on yhdistettynä alempi ja ylempi tutkinto, ylemmän valmistumisen kruunussa on timantti.
  - Excel-versiossa sarakkeessa näkyy tieto opiskelijan ensimmäisestä ilmoittautumisesta, jonka jälkeen ilmoittautumiset esitettynä symbolein:
    <ul class="no-bullet-list">
      <li>+ = Ilmoittautunut läsnäolevaksi</li>
      <li>o = Ilmoittautunut poissaolevaksi</li>
      <li>_ = Ei ilmoittautumista</li>
    </ul>

**Courses**

Tällä välilehdellä näkyy, mitä opetussuunnitelmaan kuuluvia kursseja opiskelija on suorittanut. Valitsemalla "Include substitutions" otetaan mukaan myös arvosanat vastaavista kursseista.

Merkkien selitykset:
<ul class="no-bullet-list">
  <li>${iconToSvg(CheckIcon, theme.palette.ooditable.success)} Vihreä tarkastusmerkki = Opiskelija on suorittanut kurssin hyväksytysti</li>
  <li>${iconToSvg(CheckIcon, theme.palette.ooditable.enrollment)} Harmaa tarkastusmerkki = Opiskelija on suorittanut kurssin vastaavalla kurssikoodilla</li>
  <li>${iconToSvg(RemoveIcon, theme.palette.ooditable.recentEnrollment)} Keltainen viiva = Opiskelijalla on alle 6kk vanha ilmoittautuminen kurssille</li>
  <li>${iconToSvg(RemoveIcon, theme.palette.ooditable.enrollment)} Harmaa viiva = Opiskelijalla on yli 6kk vanha ilmoittautuminen kurssille</li>
  <li>${iconToSvg(CropSquareIcon, theme.palette.ooditable.hops)} Harmaa laatikko = Opiskelija on lisännyt kurssin opintosuunitelmaansa, mutta ei ole ilmoittautunut kurssille tai suorittanut sitä</li>
</ul>

**Modules**

Tällä välilehdellä näkyy, mitä opintokokonaisuuksia opiskelija on valinnut opintosuunnitelmaansa. Näkymä ei huomioi valinnaisia opintokokonaisuuksia.

**Tags**

Opiskelijoille voi luoda tageja ryhmittelyä varten kohdassa "Degree Program" > "Overview" > haluttu koulutusohjelma.

**Progress**

Tämä näkymä on tällä hetkellä käytössä vain kandivaiheen opinto-ohjelmissa.
Tällä välilehdellä näkyy opintojen kehitys annettujen kriteerien mukaan akateemista vuotta kohti. Kurssi merkataan tehdyksi, jos sillä on suoritusmerkintä tai hyväksiluku 
minä tahansa lukuvuonna. Opintopistekriteerin täyttämiseen vaaditaan, että opintopisteet on suoritettu kyseisen akateemisen vuoden aikana.

**Huomaa**, että klikkaamalla taulukon yläreunassa olevaa kolme pistettä sisältävää kuvaketta, voit ladata itsellesi Excel tiedoston.
Tiedosto sisältää lisäksi muita sarakkeita, kuten läsnäolon lukukausittain sekä yhteystiedot.

**Yhteystietojen käyttö on kuitenkin sallittua vain opintoneuvontaan liittyvissä asiossa.**
  `,
  studentsCustom: `
**Students**

Mikäli **"custom population"** -näkymää tarkasteltaessa ei ole erikseen valittu opinto-ohjelmaa, sarakkeissa olevat tiedot näytetään kunkin opiskelijan **Primary degree programme**  -sarakkeessa olevan (uusimman aktiivisen) ohjelman pohjalta

Taulukko näyttää oletusarvoisesti vain opiskelijanumerot, mutta harmaata liukukytkintä klikkaamalla saa näkyviin opiskelijoiden muut yhteystiedot

Klikkaamalla opiskelijanumeron vieressä olevaa sinistä henkilösymbolia, siirryt kyseisen opiskelijan **"student statistic"** -näkymään

Klikkaamalla "Sisu"-nuolta, siirryt tarkastelemaan opiskelijan tietoja Sisu-järjestelmässä

**All credits** opiskelijan kaikki opintopisteet (myös aiemmat suoritukset, eli ne jotka tehty ennen valittuun tarkastelujaksoon ja populaatioon kuulumista)

**Credits in HOPS** tarkasteltavaan opinto-ohjelmaan liitettyyn opintosuunnitelmaan kuuluvat opintopisteet

**Credits since start** kuinka paljon opintopisteitä on kertynyt valitussa opinto-ohjelmassa aloittamisen jälkeen
`,
  studentsGuidanceGroups: `
**Students**

Taulukko näyttää oletusarvoisesti vain opiskelijanumerot. Valitsemalla "Show student names" saat näkyviin myös opiskelijoiden nimet.

Klikkaamalla opiskelijanumeron vieressä olevaa sinistä henkilösymbolia, siirryt kyseisen opiskelijan "Student statistics" -näkymään.

Klikkaamalla "Sisu"-kuvaketta, siirryt tarkastelemaan opiskelijan tietoja Sisu-järjestelmässä.

**General**

Valikoituja selvennyksiä: 
- **Credits**
  - **All** opiskelijan suoritetut opintopisteet valitun tarkastelujakson ajalta
  - **Since** opiskelijan suoritetut opintopisteet määritellystä ajankohdasta alkaen
- **Start of study right**: Opiskelijan valittuun ohjelmaan liittyvän opinto-oikeuden alkupäivä
- **Degree programme**: Näyttää opiskelijan uusimman opinto-oikeuden. Opiskelijan kaikki opinto-oikeudet näkyvät uusimmasta vanhimpaan Excel-tiedostossa, sekä laittamalla hiiri solun päälle.
- **Other programme**: Näkyy, jos ryhmälle on asetettu opinto-oikeus. Tämä korvaa Degree programme -sarakkeen, ja toimii muuten samoin mutta näyttää opiskelijan muista opinto-oikeuksista uusimman.
- **Started in programme**: Opiskelijan valitussa ohjelmassa aloituspäivämäärä. Kandi+maisteriopiskelijoille kandiksi valmistumispäivämäärä +1.
`,
}
