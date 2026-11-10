# Calculator

A React + Vite browser calculator with a basic calculator, online currency conversion (including KGS and RUB), linear/quadratic equation solving, fuel-cost calculation, persistent browser history, light/dark themes, and Russian/English UI.

## Run locally

```powershell
npm install
npm run dev
```

## Deploy to Vercel

Import this repository into Vercel and use the Vite preset. The root `vercel.json` configures `npm run build` and publishes `dist`.

Currency rates use ExchangeRate-API's open endpoint and require an internet connection. Preferences and history are saved in the current browser's local storage.
