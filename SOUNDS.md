# How to Add Real Tube Sounds

The quiz needs MP3 recordings of each tube line placed in the `sounds/` folder.
Name each file by line ID: `bakerloo.mp3`, `central.mp3`, etc.

## Where to Get Recordings

### Freesound.org (Free, CC-BY license — requires free account)

Search and download these recordings. Trim each to ~15-30 seconds of in-tunnel
train sound (removing station announcements if you want a harder quiz).

| Line | Search / Recording | Freesound ID |
|------|-------------------|--------------|
| Bakerloo | Kalou — "London Underground: Bakerloo line ambience" | 343141 |
| Central | ermine — "Central Line, mind the doors" | 60485 |
| Circle | Kalou — "London Underground: Circle line ambience" | 343145 |
| District | kwahmah_02 — "Evening District Line journey" | 327943 |
| Jubilee | Kalou — "London Underground: Jubilee line ambience" | 343144 |
| Metropolitan | kwahmah_02 — "Baker Street to Piccadilly Circus" | 267697 |
| Northern | ERH — "Bank to Camden Town via Northern Line" | 56639 |
| Victoria | Emanuele_Correani — "Inside Victoria Line train" | 332777 |

### Lines with fewer free recordings

| Line | Suggestion |
|------|-----------|
| Piccadilly | Search Freesound for "piccadilly line" or record your own |
| Hammersmith & City | Uses same S-stock as Circle — record your own for distinction |
| Elizabeth | Newest line — very few free recordings exist. Record your own |
| Waterloo & City | Search Freesound for "waterloo city line" or record your own |

### Recording your own (best option!)

Each line genuinely sounds different. A 30-second phone recording inside the
carriage between stations will work perfectly. Record in-tunnel sections for
the most distinctive sound (avoid station stops).

Tips:
- Hold your phone still to reduce handling noise
- Record between stations (the in-tunnel sound is what's distinctive)
- 15-30 seconds is plenty
- Export/convert to MP3

## File naming

Place files in the `sounds/` directory:

```
sounds/
  bakerloo.mp3
  central.mp3
  circle.mp3
  district.mp3
  hammersmith.mp3
  jubilee.mp3
  metropolitan.mp3
  northern.mp3
  piccadilly.mp3
  victoria.mp3
  elizabeth.mp3
  waterloo.mp3
```

The quiz automatically detects which files are present and only asks questions
for lines that have audio. You need at least 3 lines to play.

## Attribution

If using Freesound CC-BY recordings, credit the original authors.
The app includes attribution in the source code comments.
