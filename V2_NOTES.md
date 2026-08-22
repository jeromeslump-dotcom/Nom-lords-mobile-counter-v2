# Lords Mobile Counter Picker — V2

V2 is independent of Bolt and Base44.

- React + TypeScript + Vite
- Combat history is stored locally in the browser
- `src/heroes.ts` contains hero data and Type/Class rules
- `src/counter.ts` contains the V2 recommendation engine

The V2 engine evaluates complete 5-hero teams using:

- type counters
- class counters
- historical results
- exact team history when available
- partial team overlap with historical combats
- role balance
- class/type diversity
- enemy coverage

`recommendTeam(enemyIds, combats)` uses a beam-search strategy rather than choosing five heroes independently.
