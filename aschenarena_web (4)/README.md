# Aschenarena (Browser, mit Online-Relay)

Das Spiel ist `public/index.html` (Three.js). `server.js` liefert die Seite aus und leitet
Online-Nachrichten zwischen zwei Spielern weiter. Keine Abhängigkeiten, nur Node 18+.

## Lokal testen
    node server.js        # dann http://localhost:3000 in zwei Browser-Tabs öffnen

## Auf Render bereitstellen (kostenlos)
1. Diesen Ordner in ein neues GitHub-Repository hochladen (Dateien direkt im Repo-Root).
2. render.com > New > **Web Service** > das Repo wählen.
3. Runtime: Node, Build Command leer lassen (oder `npm install`), Start Command: `node server.js`, Plan: Free.
4. Nach dem Deploy die Render-Adresse (https://....onrender.com) an den Freund schicken.

## Online spielen
Beide öffnen dieselbe Render-Adresse. Einer klickt **Match hosten** und schickt den angezeigten Code,
der andere gibt ihn ein und klickt **Beitreten**. Der Host rechnet das Spiel, der Gast schickt Eingaben.
Kostenlose Render-Dienste schlafen nach Inaktivität ein: der erste Aufruf kann bis zu einer Minute dauern.

## Neu in dieser Version
- Online: Spieler 2 kann den Champion über die Karten wechseln (das Match startet dann neu).
- Eroberungszonen sind deutlich größer, der Golem ist entfernt, Heilpacks haben einen Lichtstrahl und sind größer.
- Zoom ist näher und nur noch begrenzt auszuzoomen, keine Ziellinie mehr, neuer Dreieck-Mauszeiger.
- Vollbild per Button oder Taste V. Grafikstufe per Button (Auto, Hoch, Mittel, Niedrig).
- Neue, per Web-Audio synthetisierte Soundeffekte.

## Update: Ton & Zoom
- Leise, ruhige Hintergrundmusik (Taste/Knopf "Musik" schaltet sie aus).
- Realistischere Soundeffekte (Aufprall, Metall, Luft, Grollen statt Pieptöne).
- Zeiger bleibt golden und ruhig beim Klicken.
- Kamera: maximaler Auszoom deutlich näher.

## Update: Götter, Heilpacks, Zonen
- 8 verschiedene Götter-Statuen (Zeus, Poseidon, Athene, Apollon, Anubis, Thor, Odin, Ares).
- Heilpacks: grüne Pluszeichen, Countdown (5 s) bevor sie aktiv werden.
- Zonen größer, Zonen-Buffs 12 s statt 25 s; Ringe/Symbole erscheinen nur, wenn die Zone aktiv ist.
- Ambient-Kampfmusik (dunkler Klangteppich + ferne Trommeln), Zoom etwas weiter.

## Update
- Kamera etwas weiter, Statuen mit Armen, Sechsstern aus dem Zonen-Symbol entfernt.

## Update: Champions & Auswahl
- Startbildschirm mit Charakterauswahl: gezeichnete Anime-Titelbilder, Name und Fähigkeiten. Maus drüberfahren, klicken oder Pfeiltasten + Enter. Über „Champion wählen“ jederzeit wieder erreichbar.
- Silke entfernt; neu: Nerith (Seelenrufer/Beschwörer), Aurelian (Paladin), Sylwen (Bogenschützin).
- Morgrath überarbeitet (mehr Leben/Tempo, längere Reichweite, mehr Schaden); Vesper, Nerith, Chrona, Aurelian leicht ausbalanciert.
- Realistischere Götter-Statuen, Kamera etwas weiter draußen.

- Titelbilder im modernen Anime-Stil überarbeitet (3/4-Gesicht, scharfe Augen, fließendes Haar); Kamera noch etwas weiter draußen.
- Auswahlbildschirm im Stil eines Fantasy-Spiels: großes Feld für den gewählten Champion links, die anderen als Streifen, Fähigkeits-Symbole, Gegner- und Bot-Stärke-Leiste unten.
- Eigene Titelbilder: Dateien in `public/art/` (mage.jpg, glad.jpg, reap.jpg, time.jpg, vesper.jpg, nerith.jpg, aurel.jpg, sylwen.jpg) ersetzen die gezeichneten automatisch.
