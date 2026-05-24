<!-- BEGIN:stack-rules -->
this project is VITE + react 19 + typescript, NOT next.js. there is no app router, no server components, no /pages or /app dir. it is a single-page client-side app. the entry is index.html -> src/main.tsx -> src/App.tsx. do NOT add next.js, do NOT add SSR.
<!-- END:stack-rules -->

# AGENTS.md

## about moirai

moirai is a neon dashboard + simulator for scheduling heavy compute into the cleanest and cheapest grid windows. core pieces:

1. **dashboard** — when/where on the grid it's clean (low gCO2/kWh) AND cheap (low $/kWh) right now and in the upcoming hours.
2. **scheduler** — drop a workload (training run, batch job, render) and align it to the best window across regions.
3. **AI recommendation layer** — explains the tradeoff, picks a window, narrates why.

## stack

vite, react 19, typescript (strict), tailwind, zustand. framer motion for transitions. deploy to vercel.

## conventions

- typescript strict, prefer explicit types over `any`
- functional components + hooks
- aesthetic: neon holographic — deep space bg, glowing accents, cyan/green/violet palette
- color logic: cool/green = clean & cheap, hot = dirty or expensive, gold = value/savings

## current build phase

post-pivot cleanup. minimal scaffold + neon tokens. do not add features outside the current step without asking.
