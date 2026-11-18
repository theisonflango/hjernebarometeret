# Hjernebarometerets projektplan

[Start her med prioriteringer og projektkort](START-HER.md) · [Fælles opgaver](FAELLES.md) · [Roadmap](ROADMAP.md) · [Faglig godkendelse](PIPELINE.md)

Hvert fagligt område har sin egen [projektmappe](tests/). Stress og udbrændthed har separate opgavelister. Virksomhedsanalysen har sit eget rådgivningsspor. EQ og DIVA-5 har korte kort, der beskriver deres status som kommende tilbud.

## Arbejdsudkast til faglig gennemgang

[Formularkontrol for ADHD](tests/adhd/DANSK-FORMULAR.md) · [Formularkontrol for oplevet stress](tests/oplevet-stress/DANSK-PSS-10.md) · [Kommerciel brugsret og faglig godkendelse](grundlag/DANSKE-FORMULARER-OG-BRUGSRET.md) · [Karriereside](tests/karriere/udkast.html) · [Supplerende research og konkrete prøveprofiler](grundlag/FAGLIG-OPFOELGNING.md)

Kør `node scripts/vis-udkast.mjs` fra repoets rod og åbn den lokale adresse, der står i terminalen. De to kliniske prøver bruger fiktive svar. Åbn den danske kildeformular fra linket i prøven og overfør svarene efter nummer. Den lokale visning henter hverken kildeformularen eller data fra eksterne tjenester automatisk. Et frivilligt klik fra en klinisk resultatside åbner samtalearket i samme fane. Karrieresiden kan også hentes som en enkelt HTML-fil og åbnes offline.

De automatiske scorekontroller kan gentages med `node --test tests/*.mjs`. Mens den lokale visning kører, kan en udvikler med Playwright og Chromium genprøve de tre almindelige brugerforløb med `node tests/faglige-forloeb.cjs http://127.0.0.1:PORT`. Brug det portnummer, der står i terminalen. En eksisterende Chromium-installation kan vælges med `CHROMIUM_EXECUTABLE`.

De fire kliniske arbejdssider ligger i `paused-site`. Koden fra før ændringen findes i [F-01-revisionen](https://github.com/theisonflango/hjernebarometeret/tree/32879cf/paused-site). GitHub Pages udgiver `site` fra `main`. Produktejer og faglige reviewere tager særskilt stilling til udgivelse, når de åbne spørgsmål på projektkortene er afklaret.
