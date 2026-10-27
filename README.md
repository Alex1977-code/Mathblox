# Mathblox 🧱➗

Ein 3D-Parkour-Spiel fürs Handy im Stil von Roblox-„Obbys“ – nur dass sich jedes Tor erst öffnet,
wenn man die Matheaufgabe richtig löst. Läuft direkt im Browser (Handy, Tablet, PC), ohne App-Store.

## So wird gespielt

- **Laufen:** linke Bildschirmhälfte – Daumen aufsetzen und ziehen (virtueller Joystick)
- **Springen:** runder Knopf rechts unten
- **Umschauen:** auf der rechten Seite wischen
- Am PC: `WASD`/Pfeiltasten, `Leertaste`, Maus ziehen, Mausrad zoomt, `Esc` = Pause

In jedem Level hüpft man über Plattformen zu den **Mathe-Toren**. Läuft man ans Tor, erscheint eine
Aufgabe. Richtig gelöst → Tor geht auf, Checkpoint gesetzt, Münzen gibt es obendrauf (Serien-Bonus!).
Falsch → die richtige Lösung (oft mit Rechenweg) wird gezeigt und es kommt eine neue Aufgabe.
Hinter manchen Toren stehen **Bonus-Truhen** mit einer etwas schwereren Aufgabe (+25 Münzen, nur ein Versuch).

Mit den Münzen kauft man im **Avatar-Shop** Hüte, Shirt-, Hosen- und Hautfarben.
Am Ziel gibt es 1–3 Sterne, je nachdem wie viele Fehler man gemacht hat.

Ab Level 2 kommen bewegte Plattformen dazu, ab Level 3 Lava-Steine, ab Level 4 schmale Stege
und lange Fahrplattformen, ab Level 6 Eisplatten, die nach kurzer Zeit verschwinden.

## Klassen und Schwierigkeit

Im Hauptmenü wählt man **Klasse 1–10**, **Leicht / Mittel / Schwer** und ob man Antworten
**auswählt** (4 Möglichkeiten) oder **eintippt** (Ziffernblock, auch Brüche wie `3/4` und Dezimalzahlen mit Komma).

| Klasse | Leicht | Mittel | Schwer |
|---|---|---|---|
| 1 | Plus/Minus bis 10 | bis 20 ohne Zehnerübergang | mit Zehnerübergang, Platzhalter |
| 2 | Zehnerzahlen, ZE ± E | Plus/Minus bis 100, 2er/5er/10er-Reihe | Einmaleins, Teilen, Verdoppeln/Halbieren |
| 3 | Einmaleins, Geteilt | Plus/Minus bis 1000, mal 10/100 | ZE · E, Platzhalter, ZE : E |
| 4 | Bis 10 000, Runden | HZE · E, HZE : E | ZE · ZE, Punkt vor Strich, bis 1 Million |
| 5 | Klammern, Größen umrechnen | Quadratzahlen, Potenzen, Rechteck | HZE · ZE, durch zweistellige Zahl, ggT/kgV |
| 6 | Gleichnamige Brüche, Bruchteil von | Kürzen, Dezimalzahlen, Bruch → Dezimal | Ungleichnamige Brüche, Bruch · Bruch, Dezimal · |
| 7 | Negative Zahlen ± | Negative · und :, Prozent | Lineare Gleichungen, Dreisatz, Grundwert |
| 8 | Terme einsetzen, Potenzen | Gleichungen mit Klammern / x auf beiden Seiten | Binomische Formeln, Gleichungssysteme |
| 9 | Wurzeln | Pythagoras | Quadratische Gleichungen, negative Exponenten |
| 10 | Potenzgesetze, lineare Funktionen | Steigung, Nullstelle, Logarithmus | Scheitelpunkt, sin/cos/tan, Zinseszins |

Bei Mittel und Schwer kommen zu etwa 25 % auch Wiederholungsaufgaben aus den leichteren Stufen.

## Starten

Das Spiel besteht nur aus statischen Dateien. Lokal:

```bash
npm start          # oder: python3 -m http.server 8080
# dann http://localhost:8080 öffnen (am Handy: http://<IP-des-PCs>:8080 im selben WLAN)
```

**Online fürs Handy (GitHub Pages):** In den Repository-Einstellungen unter
*Settings → Pages → Source* „GitHub Actions“ auswählen. Danach baut der Workflow
`.github/workflows/pages.yml` bei jedem Push auf `main`/`master` die Seite.
Auf dem Handy kann man sie über „Zum Home-Bildschirm hinzufügen“ wie eine App installieren
(Vollbild, funktioniert dank Service Worker auch offline).

## Tests

```bash
npm test
```

Prüft für jede Klasse und Stufe tausende zufällige Aufgaben: gültige Zahlen, genau eine richtige
von vier verschiedenen Antworten, keine negativen Ergebnisse bis Klasse 6, Eingabeprüfung (Komma, Minus, Brüche).

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html`, `css/style.css` | Menüs, HUD, Aufgabenfenster |
| `js/main.js` | Spielschleife, Physik, Kamera, Spielstand (localStorage) |
| `js/math.js` | Aufgaben-Generator für Klasse 1–10 |
| `js/level.js` | Level-Generator (Plattformen, Tore, Truhen, Münzen) |
| `js/avatar.js` | Klötzchen-Avatar und Shop-Artikel |
| `js/controls.js` | Joystick, Sprungknopf, Tastatur, Kamera |
| `js/audio.js` | Soundeffekte per WebAudio |
| `vendor/three.module.min.js` | [three.js](https://threejs.org) r170 (MIT) |
