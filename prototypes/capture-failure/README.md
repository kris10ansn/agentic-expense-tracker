# Capture outcome design prototype

This standalone prototype contains the **Capture failed** and **Capture complete · Review needed** designs discussed in the design session. It is archived on `chore/capture-cards-reference` for other agents to inspect. It uses sample data and does not call the app API.

## Open the prototype

From the repository root, run:

```sh
python3 -m http.server 4319 --bind 127.0.0.1 --directory prototypes/capture-failure
```

Open [inline cards](http://127.0.0.1:4319/?variant=A&scenario=both&pending=current) to see the pending, failed, and needs-review states together. Open the [component library](http://127.0.0.1:4319/?variant=A&scenario=both&pending=current&view=components) for the individual designs.

You can also open `index.html` directly. No install or build is required.

## Find the designs

| Design | Component | Source in `app.js` |
| --- | --- | --- |
| Capture failed | 1 | `failedCard()` |
| Capture complete · Review needed | 2 | `partialCard()` |
| Individual unsaved expense | 3 | `itemRow()` |
| Proposed active capture | 7 | `proposedActiveCard()` |
| Revised pending entry | 8 | `currentPendingCapture()` |

`styles.css` supplies the visual styles. Layout A uses inline cards, B uses an activity panel, and C uses a review inbox. Actions are simulated and reset on reload.

The files are copied from the original standalone prototype, including the bundled font and all screenshots. Screenshots record earlier design iterations; the HTML, CSS, and JavaScript contain the latest prototype. Original comments about the prototype living outside the app describe its original location.

The React styling change is recorded in commit `bda82d8`. This branch also includes the later capture work through `0f9cb6b`. The prototype includes source-preview eye buttons; the requested React styling change omitted them and uses standard Tailwind sizes.
