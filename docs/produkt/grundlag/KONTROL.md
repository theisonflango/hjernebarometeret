# Hvad gælder stadig?

**Kontrolleret 18. november 2026.** GitHubs aktuelle `main` var `02d3aebf58446b0d5d7aa491ec045cb6d47ab878`. Seneste succesfulde GitHub Pages-udgivelse anvendte samme commit. I denne gennemgang blev 24 offentlige filer hentet og sammenlignet byte for byte med den lokale kopi af den revision. Alle 24 var identiske: forsiden, otte test-/analysesider, syv aktive rapporter, fem fælles scripts (normer, kort, betaling, login og analyse), jobdata, prisoversigt og privatlivspolitik. [Udgivelsen](https://github.com/theisonflango/hjernebarometeret/actions/runs/29641475947) · [Kildekode ved kontrollen](https://github.com/theisonflango/hjernebarometeret/tree/02d3aebf58446b0d5d7aa491ec045cb6d47ab878)

**Ny isoleret kontrol.** De 60 fiktive profiler fra tidligere blev kørt igen mod frontendkoden i en lokal browser med en lokal erstatning for betaling, konto og rapportadgang. Forventninger og observerede hovedresultater matchede tidligere kørsel i alle 60. Desuden blev 15 rapportvisninger og syv PDF-eksporter kørt igen, sammen med særskilte tjek af AQ-gentagelse, ADHD-tastatur, den synlige IQ-tælleserie og virksomhedssidens fejltilstand. Fiktive besvarelser blev ikke sendt til tjenesten.

| Område | Eksempel fra kontrollen | Betydning for første handling |
|---|---|---|
| ADHD | Nulprofil gav 0/6 og stadig etiketten “Kombineret ADHD”. Tastaturforløbet gjorde det muligt at gå videre fra spørgsmål 2 med et automatisk valgt svar. | Afskærm visning og kort. Genskab begge fejl før ny faglig udgave. |
| AQ | Forventet 25 blev 26, og 32 blev 31. Kommunikationsdelen kunne vise 12/10. Ved gentagelse viste anden skærm 49, mens den gemte rapportscore var 1. | Afskærm scoring og ny rapport. Uafhængig nøgle og sessionskontrol skal begge bestås. |
| OCD | Profiler med maksimum på enten vask eller tjek gav 12/72. Rapporten anvendte en beroligende tekst om normalområdet trods maksimal lokal belastning. | Afklar instruktion og fortolkning før yderligere salg. |
| PSS og udbrændthed | Midtersvar gav 20/40 i PSS-10 og “fuldt burnout-syndrom” i rapporten fra den fælles test. | Behandl de to faglige anvendelser separat. |
| IQ | Tælleserien gav to visuelt identiske svar, men kun ét nøglekorrekt svar. 0 og 5 nøglekorrekte blev begge omregnet til IQ 66. | Afgræns til øvelser med entydige opgaver efter rettelse. |
| Big Five | Høj åbenhed med øvrige træk i midten gav forskellige profilnavne i rapport og kort. I gratisvisningen nåede befolkningspåstanden 100 %. | Afgræns normudsagn, og vælg dokumenteret udgave før ny rapport. |
| Karriere | Den praktisk orienterede RIA-profil viste jordforsker 81 % gratis og 0 % i rapporten. De viste interesser i rapporten var nul. 10 af 20 job var gemt. | Luk berørt salgsvej. Brug RIA til at godkende rettelsen. |
| Virksomhed | 35 spørgsmål og fejlbesked ved isoleret, afbrudt modelkald. Den fulde rapport er stadig markeret som kommende på den udgivne side. | Afklar adgang og evalueringsgrundlag. Ingen dom over faktiske modelsvar. |

Den isolerede kørsel efterprøver beregning, visning og eksport. Den kan ikke dokumentere gennemført kundebetaling i drift, aktuel databasestatus, adgang for andre brugere, købsmønstre, klinisk validitet eller hvilke private licensaftaler ejeren har. EQ og DIVA står som kommende tilbud. Der er tilføjet korte statuskort for [EQ](../tests/emotionel-intelligens/README.md) og [DIVA-5](../tests/diva-5/README.md).

## Medfølgende arbejdsgrundlag

- [Testkvalitet og betalingsværdi · oprindelig gennemgang](Hjernebarometeret-testkvalitet-og-betalingsvaerdi.pdf)
- [Strategi for faglige tests · standarder, alternativer og pilotdesign](Hjernebarometeret-strategi-for-faglige-tests.pdf)
- [Fiktive testcases · input, forventet og observeret](Hjernebarometeret-fiktive-testcases.json)

De to PDF-bilag er daterede kopier. Det offentlige JSON-bilag indeholder forventninger og observationer for AQ. De ti fulde AQ-svarvektorer, som tilsammen gengiver scoringsnøglen, ligger i det oprindelige lokale analysebilag. Nye opgavestatusser hører til i projektkortene og på [ejerens oversigt](../START-HER.md).
