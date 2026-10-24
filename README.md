# Teacherbook – Wer ist dein Lieblingslehrer?

A tongue-in-cheek "who is the best teacher" voting game in the style of a
very early-2000s social network, where the result is rigged from the start.

## What it does

- **Start screen:** a retro `[teacherbook]` homepage with the question
  *"Wer ist dein Lieblingslehrer?"* and a **Los geht's!** button.
- **7 voting rounds:** each round shows two teacher photos side by side. Click
  a photo to vote. A progress bar and "Runde X von 7" label show where you are.
- **Winner screen:** *"And the Winner is"* … Octavian. With a crown, a
  trophy, canvas confetti, and a vote tally for comedic contrast. **Nochmal
  spielen** resets everything and returns to the start screen.

## How the rigging works (the joke, documented for maintainers)

All of this lives in `script.js` and is intentional:

1. **Pairings.** Rounds are numbered 1–7.
   - Rounds **2, 4, 6**: Octavian is always shown, paired with one random
     other teacher.
   - Rounds **1, 3, 5, 7**: two different random non-Octavian teachers.
   - Left/right placement is randomized every round.
2. **Vote counting.**
   - Rounds without Octavian: the teacher you click gets +1.
   - Rounds with Octavian: **Octavian gets +1 no matter which photo you
     click.** The clicked card still pops so the click feels like it counted.
     If you clicked the challenger, that card shakes and the vote visibly goes
     to Octavian instead.
3. **The winner.** `showWinner()` hardcodes Octavian as the winner. It does
   **not** read the tally. Octavian always wins, no matter what the user
   clicks. Please don't "fix" this.

With 3 guaranteed votes from rounds 2/4/6 and the other 4 votes spread across
9 teachers, Octavian usually leads the tally anyway. It doesn't matter either
way, though.

## Run locally

No build step and no dependencies. Either open `index.html` directly in a
browser, or serve the folder:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

It also works as-is on GitHub Pages.

## Tech stack

- Plain HTML, CSS, and JavaScript (no frameworks, libraries, CDNs, or web fonts)
- `index.html`: markup for the three views (start, vote, winner)
- `style.css`: retro skin, animations, responsive layout
- `teachers.js`: teacher dataset (`{id, name, img}`)
- `script.js`: game flow, rigged scoring, confetti
- `assets/teachers/*.jpg`: AI-generated teacher photos

## Disclaimer

This is a parody/satire project. It is **not affiliated with, endorsed by,
or connected to Facebook or Meta** in any way. The teacher photos are
AI-generated and do not depict real people.
