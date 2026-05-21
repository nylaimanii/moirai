<!-- BEGIN:stack-rules -->
this project is VITE + react 19 + typescript, NOT next.js. there is no app router, no server components, no /pages or /app dir. it is a single-page client-side 3d app. the entry is index.html -> src/main.tsx -> src/App.tsx. do NOT add next.js, do NOT add SSR. three.js runs client-side only.
<!-- END:stack-rules -->

# AGENTS.md

## about moirai

moirai is an interactive 3d web app. a neon-holographic globe of major construction projects worldwide. the core flow:

1. **globe** — rotating wireframe earth, glowing landmasses, project pins. orbit + zoom.
2. **the dive** — click a pin, camera flies from orbit down to street level, globe dissolves into a city.
3. **city + ripples** — procedural neon wireframe district. the project's impact animates: pollution drift, traffic pulse, health ripples, economy glow, habitat flicker. floating stat readouts.

## stack

vite, react 19, typescript (strict), three.js, zustand, tailwind, framer motion. deploy to vercel.

## conventions

- typescript strict, prefer explicit types over `any`
- functional components + hooks
- three.js scene logic lives in src/three/ (plain ts modules), react owns ui/state only
- aesthetic: y2k neon holographic — deep space bg, glowing wireframes, cyan/green/violet palette
- color logic for impacts: cool/green = benefit, hot = burden, gold = economic value

## current build phase

scaffolding. do not add features outside the current step without asking.
