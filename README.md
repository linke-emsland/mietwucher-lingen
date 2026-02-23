# Mietwucher-Checker Lingen (Ems)

**Ein Tool von DIE LINKE Emsland zur Überprüfung der eigenen Miete anhand des qualifizierten Mietspiegels der Stadt Lingen (Ems), Stand 1. April 2023.**

🔗 **Live:** [dielinke-emsland.de](https://dielinke-emsland.de/service/mietwucher-lingen)

---

## Worum geht es?

Viele Mieter:innen in Lingen wissen nicht, ob ihre Miete rechtlich zulässig ist. Dieses Tool macht die Berechnung der ortsüblichen Vergleichsmiete nach dem [Mietspiegel 2023 der Stadt Lingen (Ems)]([https://www.lingen.de](https://www.lingen.de/bauen-wirtschaft/wohnen-lingen/mietpreisspiegel/mietspiegel.html)) öffentlich und nachvollziehbar – direkt im Browser, ohne Registrierung, ohne Datenspeicherung.

Übersteigt die tatsächliche Miete die Vergleichsmiete um mehr als **20 %**, kann eine Ordnungswidrigkeit vorliegen (Bußgeld bis 50.000 €). Bei mehr als **50 %** Überschreitung droht eine Straftat nach **§ 291 StGB (Mietwucher)**.

---

## Features

- Vollständig **clientseitig** – keine Daten verlassen den Browser
- **Straßen-Autocomplete** aus dem offiziellen Wohnlageverzeichnis (1.014 Straßen)
- **Automatische Lagebestimmung** nach Hausnummer (Innenstadt / Stadtgebiet / Ortsteile)
- **Modernisierungsrechner** mit 8 Kategorien und Punktesystem nach Mietspiegel
- **Modifiziertes Baujahr** berechnen (für sanierte Gebäude bis Baujahr 2005)
- **Zuschläge** für Fahrstuhl (+5 %) und Penthouse (+14 %)
- **Einordnung** des Ergebnisses (OK / Ordnungswidrigkeit / Straftat)
- **PDF-Export** über Browser-Druckfunktion


---

## Technisches

Das Tool besteht aus einer einzigen, selbstständigen HTML-Datei (`mietwucher-lingen.html`) ohne externe Abhängigkeiten zur Laufzeit.

| Eigenschaft | Details |
|---|---|
| Dateityp | Einzelne `.html`-Datei |
| Externe Laufzeit-Abhängigkeiten | nur Google Fonts |
| Datenspeicherung | Keine – rein clientseitig |
| Framework | Vanilla JavaScript |
| Datenbasis | Mietspiegel 2023, Stadt Lingen (Ems) |


### Einbindung als direkte HTML-Datei

Die Datei kann auch direkt auf einem Webserver abgelegt und verlinkt werden.
Bitte angeben, dass der Rechner von **Die Linke Kreisverband Emsland** kommt.

---

## Berechnungsgrundlage

Die Berechnung folgt dem **qualifizierten Mietspiegel der Stadt Lingen (Ems)** vom 1. April 2023, der gemäß § 558d BGB als Grundlage für die ortsübliche Vergleichsmiete gilt.

### Berechnungsablauf

1. **Basismiete** (€/m²) aus Tabelle nach Wohnfläche und Baualtersklasse
2. **Modifiziertes Baujahr** bei Modernisierungen (≥ 4 Punkte, nur Baujahre bis 2005)
3. **Lagezuschlag/-abschlag** je nach Wohnlage:
   - Innenstadt: **+8 %**
   - Stadtgebiet: **±0 %**
   - Ortsteile: **−10 %**
4. **Ausstattungszuschläge:**
   - Fahrstuhl: **+5 %**
   - Penthouse: **+14 %**
5. **Vergleich** der errechneten Vergleichsmiete mit der tatsächlichen Kaltmiete


---

## Rechtlicher Hinweis

> Dieses Tool dient ausschließlich zur Orientierung. Es ersetzt keine Rechtsberatung. Die Ergebnisse basieren auf dem Mietspiegel 2023 der Stadt Lingen (Ems) und sind ohne Gewähr. Im Zweifelsfall wenden Sie sich an eine Mieterrechtsberatung.

**Beratungsempfehlung:** Deutscher Mieterbund Emsland e.V.

---

## Warum Open Source?

Wir veröffentlichen diesen Code aus Überzeugung: Werkzeuge, die Menschen bei der Durchsetzung ihrer Rechte helfen, sollen offen und nachvollziehbar sein. Jede:r soll prüfen können, ob die Berechnung korrekt ist – und das Tool gerne weiterentwickeln oder für andere Kommunen adaptieren.

Wer den Code für andere Mietspiegel anpassen möchte: Die relevanten Datentabellen befinden sich direkt im `<script>`-Bereich der HTML-Datei als JavaScript-Objekte (`BESCHAFFENHEIT`, `WOHNLAGE`, `MOD_BAUJAHR`).
