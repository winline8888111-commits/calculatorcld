# Calculator

A C# Blazor WebAssembly calculator for the browser. It includes a basic calculator, online currency conversion (including KGS and RUB), linear/quadratic equation solving, fuel-cost calculation, persistent calculation history, light/dark themes, and Russian/English UI.

## Run locally

Install the .NET 10 SDK, then from `CalculatorWeb` run:

```powershell
dotnet run
```

## Deploy to Vercel

Import this repository into Vercel and set **Root Directory** to `CalculatorWeb`. The included `vercel.json` installs the .NET 10 SDK if needed, publishes the Blazor app, and serves the static output from `publish/wwwroot`.

Currency rates are fetched from ExchangeRate-API's open endpoint and require an internet connection. Settings and history are stored in the browser's local storage on that device.
