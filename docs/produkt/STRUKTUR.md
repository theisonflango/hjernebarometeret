# Hvor skal arbejdet bo?

**Brug ét repo og ét projektkort pr. fagligt område.** En mappe afgrænser det faglige ansvar. Brugere kan fortsat møde flere områder i samme forløb. I dag ligger otte aktive indgange under `site/tests/`, syv aktive rapporter under `site/rapporter/`, fælles funktioner under `site/shared/` og amerikanske jobdata under `site/data/`. GitHub Pages udgiver hele `site/` samlet. Den eksisterende `PLAN.md` beskriver historiske funktioner for kort og percentiler. Brug den som kilde til tidligere beslutninger. [Udgivelsesworkflow](https://github.com/theisonflango/hjernebarometeret/blob/02d3aebf58446b0d5d7aa491ec045cb6d47ab878/.github/workflows/deploy.yml) · [Oprindelig funktionsplan](https://github.com/theisonflango/hjernebarometeret/blob/02d3aebf58446b0d5d7aa491ec045cb6d47ab878/PLAN.md)

## Tre realistiske valg

| Organisering | Hvad fungerer godt? | Hvad koster det? | Vurdering |
|---|---|---|---|
| Ét samlet plandokument med kapitler | Hurtig start, alle beslutninger samlet | Scoringsnøgler, rettigheder og uafhængige udgivelser bliver svære at følge for ni områder. En fagperson skal lede gennem hele planen. | Egnet til ejeroversigten. For spinkelt til hele arbejdet. |
| Ét repo, en fælles produktejeroversigt og faglige mapper | Fast sted til testens mål, belæg og opgaver. Ét ejerskab for PDF, betaling og standarder. Simple ændringer kan gå i samme review. | Kræver klare grænser for fælles og lokale opgaver. | **Anbefalet nu.** Giver adgang til at rette produktet samlet og godkende hver faglig udgave særskilt. |
| Selvstændige repos eller selvstændige apps pr. test | Giver mening ved særskilt kunde, team, udgivelse eller adgangskrav | Flere deployments, flere fælles integrationer at vedligeholde og sværere sporbarhed fra én kundeoplevelse til flere kodebaser. | Genovervej for virksomhedsrådgivning, hvis den får egen kundegruppe, økonomi og en navngiven ansvarlig. |

## Mappetræ

Planen ligger i `docs/produkt/`, som ligger uden for GitHub Pages’ publicerede webmappe. GitHub-repoet er offentligt. Læg kun materiale med passende offentliggørelsesret dér.

```text
docs/produkt/
  START-HER.md                ejerens portefølje og næste beslutning
  ROADMAP.md                  kapacitet og rækkefølge
  PIPELINE.md                 godkendelse og ændringer efter udgivelse
  STRUKTUR.md                 placering af kode, dokumentation og opgaver
  FAELLES.md                  opgaver på tværs af tests
  grundlag/                   revisionskontrol og portable analysebilag
  tests/
    adhd/README.md
    autistiske-traek/README.md
    ocd/README.md
    oplevet-stress/README.md
    udbraendthed/README.md
    figuropgaver/README.md
    personlighed/README.md
    karriere/README.md
    virksomhed/README.md
    emotionel-intelligens/README.md  kommende tilbud med eksisterende websider
    diva-5/README.md                idé i kataloget
```

Hvert README er tilstrækkeligt til at åbne et projekt. Når der findes konkret materiale, får det en placering efter brug:

| Materiale | Primært hjem og ansvar |
|---|---|
| Instrument, version, kilde, danske ændringer, formål og tilladelser | Kortets kildesektion, senere evt. `instrument.md`. Ejeren vedligeholder dato, rettighedshaver, brug og reference til privat aftale. Kontrakter, proprietære nøgler og testbanker forbliver i et adgangsstyret arkiv. |
| Scoringsnøgle og fiktive referencebesvarelser | Fagpersonen ejer den versionsmærkede reference. Gem egne eller delbare eksempler under testens `reference/`, når de findes. Brug forventninger udregnet uafhængigt af produktets kode. Dokumentér eventuelle rettighedsbegrænsninger. |
| Kode og automatiske kontroller | Bevar nuværende test- og rapportfiler som indgange. Ved senere kodearbejde kan gentagen logik udskilles, dér hvor det løser en påvist fejl. Kørbare regressionstests hører ved koden. Projektkortet linker til dem. |
| Godkendte rapporteksempler og udgivelsesbeslutning | Fiktive eksempler under testens `reference/`. I kortet føres beslutning med faglig version, kodecommit, dato, ansvarlig, tilladt brugerbesked og link til kontrol. Kun særskilt fil, hvis loggen vokser. |
| Fælles lagring, login, betaling, resultatformater, PDF og kort | Én ejer, én opgave i [FAELLES.md](FAELLES.md), flere berørte testkort med henvisninger. Fagpersonen godkender stadig ordlyden i sin egen rapport. |

**Eksempel.** Hvis PDF-eksporten består af billeder, ejer udvikleren eksportarbejdet som F-05. ADHD og karriere kan begge henvise til F-05. ADHD-fagpersonen godkender, at screeningsforklaringen fremgår. Karrierevejlederen godkender, at de tre jobspor kan ses og bruges. Hvis en værdi allerede er 0 på rapportskærmen, er den fejl lokal til rapporten, også når den gentages i PDF’en.

## Sådan holder én ejer planen ajour

[START-HER.md](START-HER.md) er facit for porteføljens prioritet og beslutningen om næste investering. Hver opgave vedligeholdes ét sted i sit lokale kort eller i fælleslisten. Roadmappet angiver rækkefølge og kapacitet. Kortets fase beskriver den faglige blokering ved kontrollen den 18. november 2026. Ved ny evidens opdateres kortets begrundelse og ejeroversigtens beslutning sammen.

Ved opstart kan ejeren sætte dato og navn på rollen i den opgave, der trækkes ind. Afslut først, når der er link til det aftalte bevis. Hvis GitHub Issues senere bliver den daglige opgavetavle, flyttes opgavestatus dertil én gang. Behold kun issue-link og faglig beslutning i projektkortet.

[Åbn ejeroversigten](START-HER.md)
