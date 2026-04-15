// ===== APP INITIALISIERUNG =====
function initApp() {
  const WOHNLAGE       = wohnlage;
  const BESCHAFFENHEIT = beschaffenheit;
  const MOD_BAUJAHR    = mod_baujahr;
  const STRASSENNAMEN  = strassennamen;

  // ── Hilfsfunktionen Validierung ───────────────────────────────────────────
  function strasseInListe(val) {
    return STRASSENNAMEN.some((s) => s.toLowerCase() === val.trim().toLowerCase());
  }

  function colorInput(el, isInvalid) {
    el.style.color = isInvalid ? "var(--rot)" : "var(--schwarz)";
  }

  // ── Autocomplete ──────────────────────────────────────────────────────────
  const strasseInput = document.getElementById("strasse");
  const suggestionsEl = document.getElementById("suggestions");
  let activeIdx = -1;
  let detectedGebiet = null;

  strasseInput.addEventListener("input", () => {
    const raw = strasseInput.value.trim();
    const val = raw.toLowerCase();
    suggestionsEl.innerHTML = "";
    activeIdx = -1;

    // Einfärben: rot wenn Text vorhanden aber nicht exakt in Liste
    if (raw.length > 0) {
      colorInput(strasseInput, !strasseInListe(raw));
    } else {
      strasseInput.style.color = "";
    }

    if (val.length < 2) { suggestionsEl.style.display = "none"; return; }
    const matches = STRASSENNAMEN
      .filter((s) => s.toLowerCase().includes(val))
      .slice(0, 12);
    if (!matches.length) { suggestionsEl.style.display = "none"; return; }
    matches.forEach((m) => {
      const d = document.createElement("div");
      d.textContent = m;
      d.addEventListener("click", () => selectStrasse(m));
      suggestionsEl.appendChild(d);
    });
    suggestionsEl.style.display = "block";
  });

  strasseInput.addEventListener("keydown", (e) => {
    const items = suggestionsEl.querySelectorAll("div");
    if (e.key === "ArrowDown") {
      activeIdx = Math.min(activeIdx + 1, items.length - 1);
      highlightSuggestion(items);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      activeIdx = Math.max(activeIdx - 1, -1);
      highlightSuggestion(items);
      e.preventDefault();
    } else if (e.key === "Enter" && activeIdx >= 0) {
      selectStrasse(items[activeIdx].textContent);
      e.preventDefault();
    } else if (e.key === "Escape") {
      suggestionsEl.style.display = "none";
    }
  });

  strasseInput.addEventListener("blur", () =>
    setTimeout(() => { suggestionsEl.style.display = "none"; }, 150)
  );

  strasseInput.addEventListener("change", updateWohnlageHint);
  document.getElementById("hausnummer").addEventListener("change", updateWohnlageHint);

  // Echtzeit-Einfärbung für Zahlenfelder
  function watchNumber(id, isInvalid) {
    const el = document.getElementById(id);
    el.addEventListener("input", () => {
      if (el.value === "") { el.style.color = ""; return; }
      colorInput(el, isInvalid(parseFloat(el.value)));
    });
  }

  watchNumber("hausnummer", (v) => v <= 0 || !Number.isInteger(v));
  watchNumber("flaeche",    (v) => v <= 0);
  watchNumber("miete",      (v) => v <= 0);
  watchNumber("baujahr",    (v) => v < 1965 || v > 2024);

  function highlightSuggestion(items) {
    items.forEach((el, i) => el.classList.toggle("active", i === activeIdx));
  }

  function selectStrasse(name) {
    strasseInput.value = name;
    suggestionsEl.style.display = "none";
    detectedGebiet = null;
    colorInput(strasseInput, false); // aus der Liste gewählt → immer gültig
    updateWohnlageHint();
  }

  function updateWohnlageHint() {
    const s = strasseInput.value.trim();
    const hn = parseInt(document.getElementById("hausnummer").value) || 1;
    const info = document.getElementById("wohnlage-info");
    if (!s) { info.innerHTML = ""; detectedGebiet = null; return; }
    const match = WOHNLAGE.find(
      (e) =>
        e.strasse.trim().toLowerCase() === s.toLowerCase() &&
        hn >= e.vonHausnummer &&
        hn <= e.bisHausnummer
    );
    if (match) {
      detectedGebiet = match.gebiet;
      info.innerHTML = `<span class="wohnlage-badge ${detectedGebiet}">Lage: ${detectedGebiet}</span>`;
    } else {
      info.innerHTML = `<span class="wohnlage-badge">Straße nicht im Verzeichnis</span>`;
      detectedGebiet = null;
    }
  }

  // ── Modernisierungspunkte ─────────────────────────────────────────────────
  function updatePunkte() {
    const ids = [
      "mod_dach", "mod_fenster", "mod_leitungen", "mod_heizung",
      "mod_daemmung", "mod_baeder", "mod_innen", "mod_grundriss",
    ];
    const sum = ids.reduce(
      (acc, id) => acc + parseInt(document.getElementById(id).value || 0),
      0
    );
    document.getElementById("punkte-val").textContent = sum;
    return sum;
  }
  window.updatePunkte = updatePunkte;

  // ── Berechnungslogik ──────────────────────────────────────────────────────

  /**
   * Gibt das wertrelevante Baujahr zurück.
   * mod_baujahr enthält ADDITIONSWERTE (Jahre die aufgeschlagen werden).
   * Das Ergebnis ist immer >= dem Ursprungsbaujahr.
   */
  function getModBaujahr(baujahr, punkte, MOD_BAUJAHR) {
    if (punkte < 4) return baujahr;

    const keys = Object.keys(MOD_BAUJAHR).map(Number).sort((a, b) => a - b);
    let baseKey = null;
    for (const k of keys) {
      if (k <= baujahr) baseKey = k;
    }
    if (baseKey === null) return baujahr;

    const table = MOD_BAUJAHR[baseKey];
    const validPts = [4, 6, 8, 10, 12, 14, 16, 18, 20];
    let usePts = null;
    for (const p of validPts) {
      if (p <= punkte && table[p] !== undefined) usePts = p;
    }
    if (usePts === null) return baujahr;

    // Additionswert aufschlagen, nie kleiner als Ursprungsbaujahr
    return Math.max(baujahr + table[usePts], baujahr);
  }

  /**
   * Ermittelt die Basismiete (€/m²) anhand der Beschaffenheitstabelle.
   */
  function getBasismiete(flaeche, wertJahr, BESCHAFFENHEIT) {
    let row = BESCHAFFENHEIT[0];
    for (const r of BESCHAFFENHEIT) {
      if (flaeche >= r.min) row = r;
    }
    let colKey;
    if      (wertJahr >= 2020) colKey = 2020;
    else if (wertJahr >= 2010) colKey = 2010;
    else if (wertJahr >= 2000) colKey = 2000;
    else if (wertJahr >= 1990) colKey = 1990;
    else if (wertJahr >= 1980) colKey = 1980;
    else                       colKey = 0;
    return row.jahre[colKey];
  }

  /**
   * Hauptberechnung
   */
  function berechnen(eingabe) {
    const { strasse, hausnummer, flaeche, baujahr, miete, fahrstuhl, penthouse, modPunkte } = eingabe;

    // Validierung
    if (!strasse || !strasseInListe(strasse))
      return { ok: false, fehler: "Eingegebene Straße ist uns nicht bekannt." };
    if (!hausnummer || hausnummer <= 0)
      return { ok: false, fehler: "Eingegebene Hausnummer kann nicht richtig sein." };
    if (!flaeche || flaeche <= 0)
      return { ok: false, fehler: "Bitte eine gültige Wohnfläche eingeben." };
    if (!miete || miete <= 0)
      return { ok: false, fehler: "Bitte eine gültige Netto-Kaltmiete eingeben." };
    if (!baujahr || baujahr < 1965 || baujahr > 2024)
      return { ok: false, fehler: "Es können nur Häuser aus den Jahren 1965 bis 2024 berechnet werden." };

    // Wohnlage ermitteln
    const match = WOHNLAGE.find(
      (e) =>
        e.strasse.trim().toLowerCase() === strasse.trim().toLowerCase() &&
        hausnummer >= e.vonHausnummer &&
        hausnummer <= e.bisHausnummer
    );
    let gebiet = match ? match.gebiet : null;
    if (!gebiet) {
      const fallback = WOHNLAGE.find(
        (e) => e.strasse.trim().toLowerCase() === strasse.trim().toLowerCase()
      );
      if (fallback) gebiet = fallback.gebiet;
    }
    if (!gebiet) gebiet = "Stadtgebiet";

    // Zuschläge
    const neueZahlen = true 
    // Der neue qualifizierte Mietspiegel bewertet die Wohnlage und ob es sich um eine Penthouse-Wohnung handelt niedriger.

    let lageZuschlag;
    let fahrstuhlZuschlag;
    let penthouseZuschlag; 
    let gesamtZuschlag;    

    if (neueZahlen){
      lageZuschlag      = gebiet === "Innenstadt" ? 4 : gebiet === "Ortsteile" ? -5 : 0;
      fahrstuhlZuschlag = fahrstuhl === "ja" ? 5 : 0;
      penthouseZuschlag = penthouse === "ja" ? 8 : 0;
      gesamtZuschlag    = lageZuschlag + fahrstuhlZuschlag + penthouseZuschlag;
    }else{
      lageZuschlag      = gebiet === "Innenstadt" ? 8 : gebiet === "Ortsteile" ? -10 : 0;
      fahrstuhlZuschlag = fahrstuhl === "ja" ? 5 : 0;
      penthouseZuschlag = penthouse === "ja" ? 14 : 0;
      gesamtZuschlag    = lageZuschlag + fahrstuhlZuschlag + penthouseZuschlag;
    }
    

    // Modifiziertes Baujahr & Basismiete
    const wertBaujahr = getModBaujahr(baujahr, modPunkte, MOD_BAUJAHR);
    const basismiete  = getBasismiete(flaeche, wertBaujahr, BESCHAFFENHEIT);

    // Ergebnisse
    const vergleichspreisM2 = basismiete * (1 + gesamtZuschlag / 100);
    const vergleichsGesamt  = vergleichspreisM2 * flaeche;
    const mieteProM2        = miete / flaeche;
    const abweichungProzent = (miete / vergleichsGesamt - 1) * 100;

    let verdictStufe;
    if      (abweichungProzent <= 0)  verdictStufe = "ok";
    else if (abweichungProzent < 20)  verdictStufe = "leicht";
    else if (abweichungProzent < 50)  verdictStufe = "ordnungswidrigkeit";
    else                              verdictStufe = "straftat";

    return {
      ok: true, fehler: null,
      gebiet, wertBaujahr, basismiete,
      lageZuschlag, fahrstuhlZuschlag, penthouseZuschlag, gesamtZuschlag,
      vergleichspreisM2, vergleichsGesamt, mieteProM2,
      abweichungProzent, verdictStufe,
    };
  }

  // ── Ergebnisse ins DOM schreiben ──────────────────────────────────────────
  function zeigeErgebnis(ergebnis, eingabe) {
    const { flaeche, baujahr, miete, strasse, hausnummer } = eingabe;
    const abw = ergebnis.abweichungProzent;

    document.getElementById("res-preis").innerHTML =
      ergebnis.vergleichspreisM2.toFixed(2) + ' <span class="result-unit">€/m²</span>';
    document.getElementById("res-gesamt").textContent     = ergebnis.vergleichsGesamt.toFixed(2);
    document.getElementById("res-deine").textContent      = ergebnis.mieteProM2.toFixed(2) + " €/m²";
    document.getElementById("res-vergleich2").textContent = ergebnis.vergleichspreisM2.toFixed(2) + " €/m²";
    document.getElementById("res-abw").textContent =
      (abw >= 0 ? "+" : "") + abw.toFixed(1) + " %";
    document.getElementById("res-baujahr").textContent =
      ergebnis.wertBaujahr !== baujahr ? `${ergebnis.wertBaujahr} (mod.)` : baujahr;

    // Verdict-Box
    const verdictBox   = document.getElementById("verdict-box");
    const verdictTitle = document.getElementById("verdict-icon-title");
    const verdictText  = document.getElementById("verdict-text");
    const infoText     = document.getElementById("info-text");
    verdictBox.className = "verdict-box";

    const VERDICTS = {
      ok: {
        css:   "verdict-ok",
        title: "Deine Miete ist im Rahmen",
        text:  () => `Deine Miete liegt ${Math.abs(abw).toFixed(1)} % unter der ortsüblichen Vergleichsmiete. Das ist völlig normal.`,
        info:  "Deine Miete entspricht dem Mietspiegel oder liegt darunter.",
      },
      leicht: {
        css:   "verdict-ok",
        title: "Deine Miete ist leicht erhöht, kein Mietwucher",
        text:  () => `Deine Miete liegt ${abw.toFixed(1)} % über der Vergleichsmiete. Das ist noch im gesetzlich zulässigen Rahmen (unter 20 %).`,
        info:  "Solange die Überschreitung unter 20 % liegt, handelt es sich rechtlich nicht um Mietwucher. Du kannst dennoch beim nächsten Mieterwechsel auf den Mietspiegel hinweisen oder Beratung suchen.",
      },
      ordnungswidrigkeit: {
        css:   "verdict-warn",
        title: "⚠ Mögliche Ordnungswidrigkeit!",
        text:  () => `Deine Miete liegt <strong>${abw.toFixed(1)} %</strong> über der ortsüblichen Vergleichsmiete. Bei Überschreitung um mehr als 20 % <em>und</em> Ausnutzung einer Mangellage kann der Vermieter mit einem Bußgeld von bis zu 50.000 € bestraft werden.`,
        info:  `<strong>Was du tun kannst:</strong><br>
1. Du hast ggf. Anspruch auf Absenkung der Miete und Rückforderung zu viel gezahlter Beträge.<br>
2. Der Vermieter muss die Mangellage auf dem Wohnungsmarkt ausgenutzt haben – das prüft im Zweifel ein Anwalt.`,
      },
      straftat: {
        css:   "verdict-danger",
        title: "🚨 Mögliche Straftat – Mietwucher!",
        text:  () => `Deine Miete liegt <strong>${abw.toFixed(1)} %</strong> über der ortsüblichen Vergleichsmiete. Bei über 50 % Überschreitung kann eine Straftat (§ 291 StGB) vorliegen. Dem Vermieter drohen härtere Strafen, theoretisch bis zu einer Freiheitsstrafe.`,
        info:  `<strong>Dringend handeln!</strong><br>
1. Du kannst eine Strafanzeige erstatten und die Miete auf das zulässige Maß absenken lassen.<br>
2. Zu viel gezahlte Miete kann zurückgefordert werden.<br>
Bewahre alle Mietunterlagen und Kontoauszüge auf.`,
      },
    };

    const v = VERDICTS[ergebnis.verdictStufe];
    verdictBox.classList.add(v.css);
    verdictTitle.innerHTML = v.title;
    verdictText.innerHTML  = v.text();
    infoText.innerHTML     = v.info;

    // Print-Bereich
    const fahrstuhlVal = document.querySelector("input[name=fahrstuhl]:checked").value === "ja" ? "Ja" : "Nein";
    const penthouseVal = document.querySelector("input[name=penthouse]:checked").value === "ja" ? "Ja" : "Nein";
    document.getElementById("print-summary").innerHTML =
      "<strong>Ihre Angaben:</strong><br>" +
      `Adresse: ${strasse || "–"} ${hausnummer || ""} · Wohnlage: ${ergebnis.gebiet}<br>` +
      `Wohnfläche: ${flaeche} m² · Baujahr: ${baujahr} · Kaltmiete: ${miete.toFixed(2)} €/Monat<br>` +
      `Fahrstuhl: ${fahrstuhlVal} · Penthouse: ${penthouseVal} · Modernisierungspunkte: ${eingabe.modPunkte}`;
    document.getElementById("print-date").textContent =
      "Erstellt am " + new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

    // Berechnungsschritte befüllen
    const baujahrLabel = (() => {
      const j = ergebnis.wertBaujahr;
      if (j >= 2020) return "2020 und später";
      if (j >= 2010) return "2010 bis 2019";
      if (j >= 2000) return "2000 bis 2009";
      if (j >= 1990) return "1990 bis 1999";
      if (j >= 1980) return "1980 bis 1989";
      return "vor 1980";
    })();

    const zuschlaege = [];
    if (ergebnis.lageZuschlag   !== 0) zuschlaege.push(`${ergebnis.lageZuschlag > 0 ? "+" : ""}${ergebnis.lageZuschlag} % Lage (${ergebnis.gebiet})`);
    if (ergebnis.fahrstuhlZuschlag)    zuschlaege.push(`+${ergebnis.fahrstuhlZuschlag} % Fahrstuhl`);
    if (ergebnis.penthouseZuschlag)    zuschlaege.push(`+${ergebnis.penthouseZuschlag} % Penthouse`);
    const zuschlaegeTxt = zuschlaege.length ? zuschlaege.join(" · ") : "keine";

    const ovm20  = ergebnis.vergleichspreisM2 * 1.20;
    const ovm50  = ergebnis.vergleichspreisM2 * 1.50;
    const abwTxt = (ergebnis.abweichungProzent >= 0 ? "+" : "") + ergebnis.abweichungProzent.toFixed(1) + " %";

    const addJahre = ergebnis.wertBaujahr - baujahr;
    const modTxt = eingabe.modPunkte > 0
      ? `${eingabe.modPunkte} Pkt. +${addJahre} Jahre → wertrelevantes Baujahr: ${ergebnis.wertBaujahr}`
      : "keine";

    document.getElementById("steps-adresse").textContent    = `${strasse} ${hausnummer}, Lingen (Ems)`;
    document.getElementById("steps-flaeche").textContent    = `${flaeche.toFixed(1)} m²`;
    document.getElementById("steps-kaltmiete").textContent  = `${miete.toFixed(2)} €/Monat`;
    document.getElementById("steps-baujahr").textContent    = `${baujahr}`;
    document.getElementById("steps-wohnlage").textContent   = ergebnis.gebiet;
    document.getElementById("steps-mod").textContent        = modTxt;
    document.getElementById("steps-basismiete").textContent = `${ergebnis.basismiete.toFixed(2)} €/m²`;
    document.getElementById("steps-zuschlaege").textContent = zuschlaegeTxt;
    document.getElementById("steps-ovm").textContent        = `${ergebnis.vergleichspreisM2.toFixed(2)} €/m²`;
    document.getElementById("steps-aktuelle").textContent   = `${ergebnis.mieteProM2.toFixed(2)} €/m²`;
    document.getElementById("steps-abw").textContent        = abwTxt;
    document.getElementById("steps-ovm20").textContent      = `${ovm20.toFixed(2)} €/m²`;
    document.getElementById("steps-ovm50").textContent      = `${ovm50.toFixed(2)} €/m²`;

    document.getElementById("result").style.display     = "block";
    document.getElementById("print-area").style.display = "block";
    document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ── Button-Handler (global, da onclick im HTML) ───────────────────────────
  window.berechnenApp = function () {
    const eingabe = {
      strasse:    document.getElementById("strasse").value.trim(),
      hausnummer: parseInt(document.getElementById("hausnummer").value) || 0,
      flaeche:    parseFloat(document.getElementById("flaeche").value),
      baujahr:    parseInt(document.getElementById("baujahr").value),
      miete:      parseFloat(document.getElementById("miete").value),
      fahrstuhl:  document.querySelector("input[name=fahrstuhl]:checked").value,
      penthouse:  document.querySelector("input[name=penthouse]:checked").value,
      modPunkte:  updatePunkte(),
    };

    const ergebnis = berechnen(eingabe);
    if (!ergebnis.ok) { alert(ergebnis.fehler); return; }

    zeigeErgebnis(ergebnis, eingabe);
  };

} // end initApp
