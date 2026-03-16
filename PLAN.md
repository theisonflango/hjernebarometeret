# Implementeringsplan: Profilkort + Percentiler

## Overblik

To features der tilføjes til alle 5 rapportsider:
1. **Delbart profilkort** — Canvas → PNG download til Instagram/stories
2. **Percentil-normdata** — Populationsbaseret percentilrangering med publicerede normtabeller

---

## Feature 1: Delbart Profilkort

### Design
- **Format:** 1080×1350px (Instagram post, 4:5 ratio — fungerer i feed OG stories)
- **Stil:** Mørk baggrund (#1c1b1a), test-specifik accentfarve, premium look
- **Indhold:** Hjernebarometeret-logo top, kerneresultat centreret, mini-visualisering, URL bund
- **Teknik:** HTML5 Canvas API, ingen eksterne biblioteker

### Per rapport:
| Rapport | Hovedresultat | Mini-visualisering |
|---------|--------------|-------------------|
| IQ | "IQ 110-124" + klassificering | 6 kognitive domæne-bars |
| ADHD | Subtype + niveau | Domæne-bars (opmærksomhed/hyperaktivitet) |
| Autisme | "AQ 32/50" + kategori | 5 domæne-bars |
| Personlighed | Arketype-label | 5 trait-bars (O/C/E/A/N) |
| Stress | Burnout-profil + PSS-score | 6 dimensions-bars |

### UI-placering
Ny sektion efter handlingsplan/ressourcer, før disclaimer:
```
📱 Del dit resultat
[Preview af kortet]  [Download knap]
```

### Implementation
- `renderProfileCard(canvas, data)` funktion i hver rapport (inline, ~80-100 linjer per rapport)
- Knap: "📱 Download profilkort" → canvas.toBlob() → download som PNG
- Preview: Vises i en `<canvas>` element skaleret ned til max 300px bred

---

## Feature 2: Percentil-normdata

### Normative kilder

**IQ** — Allerede implementeret (normCDF med mean=100, SD=15). Ingen ændringer.

**Big Five / Personlighed** — Johnson (2014) IPIP-NEO-120 normdata (N=320,128):
- Konverterer 0-100% trait-scores til percentiler via publicerede means/SDs
- Vises per trait: "Du scorer højere end X% af befolkningen på Åbenhed"
- Tilføjer percentil-label til eksisterende trait-bars

**PSS-10 / Stress** — Cohen & Janicki-Deverts (2012) (N=2,387):
- PSS raw score (0-40) → percentil via publicerede means/SDs per aldersgruppe
- Overall: mean=15.21, SD=7.28 (voksne 18+)
- Vises som: "Dit stressniveau er højere end X% af befolkningen"

**AQ-50 / Autisme** — Ruzich et al. (2015) meta-analyse + Baron-Cohen:
- AQ total (0-50) → percentil via publicerede means/SDs
- Kontrol-population: mean≈16.94, SD≈5.59
- Vises som: "Din AQ-score er højere end X% af den generelle befolkning"
- Plus kliniske cutoffs (26 screening, 32 klinisk)

**ADHD** — Ikke ægte percentiler (screening-instrument, ikke normeret skala).
- I stedet: populationsprævalens-kontekst
- Fx: "Ca. 5-7% af voksne har ADHD. Dine resultater tyder på [niveau] af symptomer"
- Tilføj severity-klassificering baseret på DSM-5 kliniske cutoffs

### Teknisk approach
- Genbruge `normCDF` funktionen fra IQ-rapporten (copy-paste til hver rapport)
- Normdata som hardcoded JS-objekter i hver rapport
- Ny sektion "📊 Percentil-rangering" med visuel bar + tekst
- Percentil tilføjes også til eksisterende domæne/trait-bars som annotation

### Percentil-visualisering
For hver relevant score:
```
Åbenhed: 72%                              Percentil: 81.
[████████████████████░░░░] 72%            "Højere end 81% af befolkningen"
```
Simpel bar med markør for brugerens position + population-gennemsnit markeret.

---

## Implementeringsrækkefølge

### Trin 1: Personlighed-rapport (pilot for begge features)
- Tilføj normdata (Johnson 2014) + percentilberegning for 5 traits
- Tilføj percentil-annotation til eksisterende trait-bars
- Ny sektion "Percentil-rangering" med population comparison
- Implementer profilkort canvas-rendering
- Test og verificer

### Trin 2: Stress-rapport
- Tilføj PSS-10 normdata (Cohen 2012) + percentil
- Profilkort med burnout-profil

### Trin 3: Autisme-rapport
- Tilføj AQ-50 normdata (Ruzich 2015) + percentil
- Profilkort med AQ-score

### Trin 4: ADHD-rapport
- Tilføj prævalens-kontekst (ikke percentil)
- Profilkort med subtype + niveau

### Trin 5: IQ-rapport
- Kun profilkort (percentil eksisterer allerede)

### Trin 6: Opdater rapporter.html
- Fjern "Terapeut-matching" fra skema og features-liste
- Fjern "Køns- og alderskorrigeret data" fra features (ikke implementeret)
- Behold "Percentil & sammenligninger" og "Delbart profilkort" (nu implementeret)

---

## Filer der ændres

| Fil | Profilkort | Percentil | Andet |
|-----|-----------|-----------|-------|
| `rapporter/personlighed.html` | ✅ | ✅ Johnson 2014 | |
| `rapporter/stress.html` | ✅ | ✅ Cohen 2012 | |
| `rapporter/autisme.html` | ✅ | ✅ Ruzich 2015 | |
| `rapporter/adhd.html` | ✅ | ⚠️ Prævalens | |
| `rapporter/iq.html` | ✅ | Eksisterer | |
| `rapporter.html` | | | Fjern terapeut-matching |
