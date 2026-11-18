# Kognitive figuropgaver

[Ejeroversigt](../../START-HER.md) · [Fælles opgaver](../../FAELLES.md) · [Udgivelsesproces](../../PIPELINE.md)

**Projektbeslutning.** Behandl den eksisterende generator som et øvelsesprojekt for voksne, der er nysgerrige på figurræsonnement. Sæt tilbuddet om intelligensmåling og betalt IQ-rapport på pause. Et normeret mål for kognition hører til et særskilt forskningsprojekt med egen finansiering.

**Brugerbesked efter kontrol.** *“Du løste 18 af 28 figuropgaver i denne runde. Her er forklaringen på den serie, du valgte forkert i.”* Tallet er et eksempel. Brugeren skal kunne se reglen og facit for de konkrete opgaver fra sin runde.

## Hvad findes i dag?

I den isolerede tælleserie viste to svarmuligheder de samme fire figurer, mens kun den ene gav point. Den femte figur kunne ikke ses i facit. 0 og 5 nøglekorrekte gav begge IQ 66. Ved 28 af 28 gav rapporten IQ 135 og intervallet 125–145. De 28 nøglekorrekte afprøver beregningskæden. Selve tælleserien blev desuden kontrolleret visuelt. Største risiko er at stille brugeren en tvetydig opgave og bagefter tillægge svaret individuel psykologisk betydning. [Tegning af figurer](https://github.com/theisonflango/hjernebarometeret/blob/02d3aebf58446b0d5d7aa491ec045cb6d47ab878/site/tests/iq.html#L162) · [Seriegenerator](https://github.com/theisonflango/hjernebarometeret/blob/02d3aebf58446b0d5d7aa491ec045cb6d47ab878/site/tests/iq.html#L248) · [Råscore og omregning](https://github.com/theisonflango/hjernebarometeret/blob/02d3aebf58446b0d5d7aa491ec045cb6d47ab878/site/tests/iq.html#L322)

**Fase og næste godkendelse.** Den nuværende formidling kræver sikring. Øvelsen begynder i fase 1, formål. Fase 4, scoring og visning, har den reproducerede tegnefejl. Første tekniske godkendelse er en rundesvarfil med entydigt facit, som en anden person kan score uafhængigt.

**Gratis og betalt.** Gratis kan være en runde, den korrekte råscore og en forståelig forklaring på et konkret svar. Et muligt senere køb er flere gennemregnede løsninger og en ny øverunde på de opgavetyper, personen gerne vil træne. Uafhængigt indhold, tilladelser og faktisk læringsværdi skal kunne dokumenteres. ICAR-studiet rapporterer forskning i instrumentets egne opgaver. Pearson beskriver bl.a. skandinavisk normering for WAIS-5. Begge er relevante sammenligninger ved en eventuel separat investeringsbeslutning om IQ. [ICAR-originalstudie](https://www.personality-project.org/revelle/publications/condon.icar.14.pdf) · [Pearsons beskrivelse af WAIS-5](https://www.pearsonclinical.dk/wais-5-faq)

Se rundernes råtal og produktets tidligere omregninger. [Fiktive testcases](../../grundlag/Hjernebarometeret-fiktive-testcases.json)

## Opgaver

| ID | Opgave og ejer | Afhænger af | Estimat | Færdig når |
|---|---|---|---|---|
| FIG-1 · P0 | **Fjern vejen til nye misvisende IQ-konklusioner.** Produktejer og udvikler. | F-01 | 2–4 t til testspecifik gennemgang | Katalog, direkte testlink, gratisresultat, rapporttilbud og gamle delingsveje er registreret og prøvet med fiktiv profil. Ny bruger kan ikke købe eller modtage IQ, percentil eller et interval fra den nuværende omregning. Gamle leverancer har en aftalt håndtering. |
| FIG-2 · P1 | **Ret tælleserien og kontroller alle generatorregler.** Udvikler og opgavekyndig reviewer. | FIG-1 og besluttet øvelsesformål | 2–4 persondage | Fastholdt eksempel viser fem tydelige figurer i facit, og hver svarmulighed kan skelnes visuelt. Hver regel, herunder rotation og spejling, har gemte ydertilfælde og kontrol for synligt ens alternativer. Tvetydige regler er fjernet eller rettet. |
| FIG-3 · P1 | **Verificér en hel runde fra svar til genåbning.** Udvikler og anden scorer. | FIG-2, F-02 | 1–2 persondage | Nøglekonstruerede runder med 0, 5, 14, 23 og 28 rigtige giver de forventede råtal i alle relevante visninger. Mus, tastatur, omvalg og tilbage ændrer kun tilsigtede svar. På mobil og desktop kan den viste figur genskabes ud fra rundens data. En ny gennemførsel giver den rigtige nye opsummering. |
| FIG-4 · P2 | **Afprøv om løsningsforklaringer hjælper.** Opgaveforfatter og brugerresearcher. | FIG-2, FIG-3, F-03 om opgavernes ophav | 1–2 persondage plus rekruttering | Fem voksne prøver et eksempel, læser forklaringen og forklarer selv reglen i en ny analog opgave. Registrér udfald og tvetydigheder. Påbegynd kun betalingsforsøg med en konkret pakke, når indhold, levering og eventuel eksport er verificeret i F-04/F-05. |
| FIG-5 · P2 | **Afgør om egentlig IQ-måling nogensinde skal finansieres.** Ejer med psykometriker. | Ekstern partner, afsat budget og klar anvendelse | 1–2 persondage til beslutning, selve studiet særskilt | Beslutningsnotatet angiver databehov til kalibrering, sammenlignelige tilfældige former, aldersnormer, apparateffekter, øvelse/retest, sammenhæng med en ekstern reference og dokumenteret individuel målefejl. Navngiv finansieringskilde eller arkivér forskningssporet. |

**Tid og genoptagelse.** Håndtér FIG-1 i første uge. Figurtræning kan vente, mens karrierepiloten bruger udviklerkapaciteten. Genåbn som øvelse efter FIG-2 og FIG-3. Genovervej først IQ-påstanden efter gennemført og uafhængigt bedømt validering for den angivne målgruppe og anvendelse.
