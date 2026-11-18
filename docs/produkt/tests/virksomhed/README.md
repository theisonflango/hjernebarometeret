# AI-virksomhedsanalyse

[Ejeroversigt](../../START-HER.md) · [Fælles opgaver](../../FAELLES.md) · [Udgivelsesproces](../../PIPELINE.md)

**Projektbeslutning.** Selvstændigt rådgivningsprojekt for ejere af en mindre virksomhed med en konkret beslutning, fx om der er likviditet til en ny medarbejder. Udskyd den annoncerede fulde rapport. Bevar kun en eventuel gratis tjeneste, hvis svarenes oprindelse og levering kan efterprøves.

**Brugerbesked der kan bære en prototype.** *“Her er de tre antagelser om kunder, udgifter og kapacitet, du selv har oplyst. Manglende tal er markeret. Du kan se, hvordan valget ændrer sig, hvis én antagelse ændres.”* En påstand om markedsvækst kræver en kilde for marked, tid og geografi.

## Hvad ved vi?

Frontenden har 35 spørgsmål, kalder en ekstern analysefunktion og viser den fulde betalte rapport som “på vej”. I det isolerede forsøg viste den en fejl og en knap til at prøve igen, da netværket var afskåret. Det dokumenterer brugerfladens fejlhåndtering. Modelversion i drift, kvaliteten af en ægte besvarelse og købt leverance er uafklaret. Største risiko er, at ejeren handler på en overbevisende markeds- eller likviditetspåstand, hvis kilde og usikkerhed mangler. [Kald af analysefunktion](https://github.com/theisonflango/hjernebarometeret/blob/02d3aebf58446b0d5d7aa491ec045cb6d47ab878/site/tests/virksomhed.html#L529) · [Tilbud om fuld rapport](https://github.com/theisonflango/hjernebarometeret/blob/02d3aebf58446b0d5d7aa491ec045cb6d47ab878/site/tests/virksomhed.html#L853)

**Fase og næste godkendelse.** Fase 1, formål. Fase 5, faglig afprøvning, kræver adgang til den faktiske model. Første beslutning er, om der foreligger et legitimt, isoleret modelmiljø, et afgrænset beslutningsproblem, en erhvervsrådgiver og tid til at efterprøve ydelsen. Ellers parkeres projektet.

**Gratis og betalt.** Gratis kunne sammenfatte brugerens egne oplysninger og stille ét konkret opfølgende spørgsmål. Betalt kunne levere to gennemregnede scenarier med kildebelagte inddata, ændringsfølsomhed og en handlingsplan. Sammenlign nytten med Virksomhedsguidens Udviklingskompas eller et simpelt rådgiverark. Bedøm, hvad ejeren kan gøre bagefter. [Virksomhedsguidens alternativ](https://virksomhedsguiden.dk/content/ydelser/udviklingskompasset/0691e4dd-11ff-48e1-ae65-3d7ecb920f26/) · [NIST om evaluering og risici ved generativ AI](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)

Den tidligere afprøvning beskriver adgangen til modellen og rapporten. [Audit af testkvalitet og leverance](../../grundlag/Hjernebarometeret-testkvalitet-og-betalingsvaerdi.pdf)

## Fagligt fund · kontrollér om rådet ændrer sig med oplysningerne

Kvalitet i denne tjeneste kan afprøves som en rådgivningsopgave. Giv to fiktive virksomheder samme spørgsmål om at ansætte en medarbejder, men forskellig likviditet. En erhvervsrådgiver angiver før forsøget, hvilke oplysninger der mangler, og hvad der kan udledes i hver case. Bedøm derefter hver anbefaling mod de oplyste tal, dens kilder og det næste skridt, som ejeren kan tage. Den hidtidige afprøvning har kun dækket brugerfladen og et fiktivt modelsvar. Et aktuelt modelsvar og en rådgivers uafhængige bedømmelse er fortsat en opgave i AI-2 og AI-3. [Isoleret rutekontrol](../../grundlag/F-01.md) · [NIST om vurdering af generativ AI](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)

## Opgaver

| ID | Opgave og ejer | Afhænger af | Estimat | Færdig når |
|---|---|---|---|---|
| AI-1 · P1 | **Afstem salgsbudskabet med det der kan leveres.** Ejer. | Porteføljebeslutning om parkering | 2–3 t | Katalog, introduktion og tilbud har samme leverancestatus. Ved utilgængelig analyse kan brugeren forstå fejlen og hvad der sker med svarene. Alle løfter om en købt fuld rapport har enten verificeret leverance eller status som kommende. |
| AI-2 · P2 | **Dokumentér data, kilder og isoleret drift.** Udvikler og ejer. | Beslutning om genoptagelse, adgang fra model-/driftsansvarlig | 1–2 persondage plus ekstern afklaring | To fiktive virksomheder kan gennemføre et reelt modelkald i testmiljø. Dato, input, prompt-, model- og skabelonversion kan genskabes. Vilkår for kommerciel brug samt leverandør, opbevaring og sletning af fortrolige oplysninger er afklaret. Fejl kan reproduceres uden kundedata. |
| AI-3 · P2 | **Byg et uafhængigt sammenligningsgrundlag.** Erhvervsrådgiver og analytiker. | AI-2, kilder og testbudget | 2–4 persondage | Et sæt på fx 12–20 cases har ét beslutningsspørgsmål og et dateret kildeark hver. Mindst to par varierer kun én faktor, fx likviditet. Mangelfulde cases kræver opfølgende spørgsmål. To rådgivere har fastlagt kritiske fejl og bedømmelseskriterier før de ser resultaterne. |
| AI-4 · P2 | **Bedøm model og skabelon blindt.** To rådgivere, koordineret af ejer. | AI-3 | 2–4 persondage samlet | Hver case køres flere gange. Registrér kildefejl, korrekt brug af input, relevante usikkerheder og ændring i anbefaling. Sammenlign med den samme simple skabelon i tilfældig rækkefølge og dokumentér bedømmeruenighed. Uafklarede kritiske fejl stopper udgivelse. |
| AI-5 · P2 | **Test om en ejer træffer et bedre valg.** Produktejer og rådgiver. | AI-4, dokumenteret adgang til målgruppen | 1–3 persondage plus rekruttering og opfølgning | En lille gruppe ejere løser beslutningscases med enten rapport eller skabelon. Registrér valg, begrundelse, tid og opfølgende handling. Opgør omkostning pr. rapport inkl. gentagelser, kildecheck og support. Godkend kun betalbar leverance efter F-04 og F-05 ved eksport. |

**Tid og genoptagelse.** AI-1 er en lille afgrænsningsopgave. De øvrige opgaver står efter karrierepiloten og kræver særskilt kapacitet. Ingen lovet lanceringsdato. Ved kritiske kildefejl eller manglende brugsværdi udgår AI-rådet, eller produktet afgrænses til en enkel skabelon. Enhver model-, prompt- eller kildeændring genkører de sårbare cases før næste udgave.
