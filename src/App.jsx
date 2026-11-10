import { useCallback, useEffect, useMemo, useState } from 'react';
import { solveMath } from './mathSolver.js';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NOK', 'PLN', 'CZK', 'TRY', 'NZD', 'HUF', 'RON', 'KGS', 'RUB'];

const CURRENCY_NAMES = {
  ru: {
    USD: 'Доллар США', EUR: 'Евро', GBP: 'Фунт стерлингов', JPY: 'Японская иена',
    CAD: 'Канадский доллар', AUD: 'Австралийский доллар', CHF: 'Швейцарский франк',
    CNY: 'Китайский юань', SEK: 'Шведская крона', NOK: 'Норвежская крона',
    PLN: 'Польский злотый', CZK: 'Чешская крона', TRY: 'Турецкая лира',
    NZD: 'Новозеландский доллар', HUF: 'Венгерский форинт', RON: 'Румынский лей',
    KGS: 'Кыргызский сом', RUB: 'Российский рубль',
  },
  en: {
    USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen',
    CAD: 'Canadian Dollar', AUD: 'Australian Dollar', CHF: 'Swiss Franc',
    CNY: 'Chinese Yuan', SEK: 'Swedish Krona', NOK: 'Norwegian Krone',
    PLN: 'Polish Zloty', CZK: 'Czech Koruna', TRY: 'Turkish Lira',
    NZD: 'New Zealand Dollar', HUF: 'Hungarian Forint', RON: 'Romanian Leu',
    KGS: 'Kyrgyz Som', RUB: 'Russian Ruble',
  },
};

const TEXT = {
  ru: {
    title: 'Калькулятор', menu: 'Меню', calculator: 'Калькулятор', currency: 'Валюты',
    math: 'Решатель задач', fuel: 'Расход топлива', history: 'История', settings: 'Настройки',
    currencyTitle: 'Конвертер валют', currencyInfo: 'Справочные курсы обновляются ежедневно. Требуется подключение к интернету.',
    amount: 'Сумма', from: 'Из валюты', to: 'В валюту', convert: 'Конвертировать',
    loading: 'Загрузка курса…', rate: 'Курс', mathInfo: 'Введите выражение или уравнение с x. Например: 2x + 3 = 11 или x² − 5x + 6 = 0.',
    mathInput: 'Выражение или уравнение', solve: 'Решить', fuelInfo: 'Расчёт стоимости поездки по цене топлива, расходу и расстоянию.',
    fuelPrice: 'Цена за литр', fuelCurrency: 'Валюта', consumption: 'Расход, л/100 км', distance: 'Расстояние, км',
    calculate: 'Рассчитать стоимость', fuelNeeded: 'Понадобится топлива', historyTitle: 'История вычислений',
    clearHistory: 'Очистить', emptyHistory: 'Здесь появятся выполненные вычисления.',
    theme: 'Тема', light: 'Светлая', dark: 'Тёмная', language: 'Язык',
    enterAmount: 'Введите корректную неотрицательную сумму.', network: 'Не удалось получить курс. Проверьте подключение и попробуйте снова.',
    timeout: 'Сервис курсов не ответил вовремя. Попробуйте ещё раз.', badRate: 'Курс выбранной валюты недоступен.',
    tooLarge: 'Сумма слишком велика.', solveError: 'Не удалось решить задачу.',
    solveHelp: 'Поддерживаются числа, скобки, +, −, ×, ÷ и степени до 2.',
    invalidFuel: 'Проверьте введённые данные.', fuelHelp: 'Цена и расстояние должны быть неотрицательными, расход — больше нуля.',
    tooLargeResult: 'Результат слишком большой.', noStorage: 'Браузер не разрешил сохранить данные.',
    trip: 'Поездка', rateError: 'Сервис курсов вернул некорректный ответ.',
  },
  en: {
    title: 'Calculator', menu: 'Menu', calculator: 'Calculator', currency: 'Currency',
    math: 'Math solver', fuel: 'Fuel cost', history: 'History', settings: 'Settings',
    currencyTitle: 'Currency converter', currencyInfo: 'Reference rates update daily. An internet connection is required.',
    amount: 'Amount', from: 'From currency', to: 'To currency', convert: 'Convert',
    loading: 'Loading rate…', rate: 'Rate', mathInfo: 'Enter an expression or equation with x, e.g. 2x + 3 = 11 or x² − 5x + 6 = 0.',
    mathInput: 'Expression or equation', solve: 'Solve', fuelInfo: 'Estimate trip cost from fuel price, consumption, and distance.',
    fuelPrice: 'Price per liter', fuelCurrency: 'Currency', consumption: 'Consumption, L/100 km', distance: 'Distance, km',
    calculate: 'Calculate cost', fuelNeeded: 'Fuel needed', historyTitle: 'Calculation history',
    clearHistory: 'Clear', emptyHistory: 'Your calculations will appear here.',
    theme: 'Theme', light: 'Light', dark: 'Dark', language: 'Language',
    enterAmount: 'Enter a valid non-negative amount.', network: 'Could not get the rate. Check your connection and try again.',
    timeout: 'The exchange-rate service timed out. Try again.', badRate: 'The selected currency rate is unavailable.',
    tooLarge: 'The amount is too large.', solveError: 'Could not solve this problem.',
    solveHelp: 'Numbers, parentheses, +, −, ×, ÷, and powers up to 2 are supported.',
    invalidFuel: 'Check the values you entered.', fuelHelp: 'Price and distance must be non-negative; consumption must be greater than zero.',
    tooLargeResult: 'The result is too large.', noStorage: 'The browser could not save data.',
    trip: 'Trip', rateError: 'The exchange-rate service returned an invalid response.',
  },
};

const initialCalc = {
  display: '0',
  stored: null,
  operator: null,
  replace: true,
  lastOperator: null,
  lastOperand: null,
  history: '',
  error: false,
};

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function formatNumber(number) {
  if (!Number.isFinite(number)) return 'Error';
  return Number(number.toPrecision(12)).toString();
}

function calculatePair(left, right, operator) {
  if (operator === '/' && right === 0) return null;
  const result = operator === '+' ? left + right
    : operator === '-' ? left - right
      : operator === '*' ? left * right
        : left / right;
  return Number.isFinite(result) ? result : null;
}

function calculatorReducer(state, action) {
  if (action.type === 'clear') return { ...initialCalc };
  if (action.type === 'digit') {
    const base = state.error ? initialCalc : state;
    const display = base.replace || base.display === '0' ? action.value : base.display + action.value;
    if (display.length > 30 || !Number.isFinite(Number(display))) return base;
    return { ...base, display, replace: false, lastOperator: null, lastOperand: null, history: base.operator ? base.history : '' };
  }
  if (action.type === 'decimal') {
    const base = state.error ? initialCalc : state;
    if (base.replace) return { ...base, display: '0.', replace: false, lastOperator: null, lastOperand: null };
    if (base.display.includes('.')) return base;
    return { ...base, display: `${base.display}.`, lastOperator: null, lastOperand: null };
  }
  if (action.type === 'sign') {
    if (state.error || Number(state.display) === 0) return state;
    return { ...state, display: state.display.startsWith('-') ? state.display.slice(1) : `-${state.display}`, replace: false };
  }
  if (action.type === 'percent') {
    if (state.error) return state;
    const amount = Number(state.display) / 100;
    const value = ['+', '-'].includes(state.operator) ? (state.stored ?? 0) * amount : amount;
    return { ...state, display: formatNumber(value), replace: false };
  }
  if (action.type === 'operator') {
    if (state.error) return state;
    const current = Number(state.display);
    let stored = state.stored;
    let display = state.display;
    if (state.operator && !state.replace) {
      const result = calculatePair(stored ?? current, current, state.operator);
      if (result === null) return { ...initialCalc, display: 'Error', error: true };
      display = formatNumber(result);
      stored = result;
    } else if (!state.operator) {
      stored = current;
    }
    const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
    return {
      ...state, display, stored, operator: action.value, replace: true,
      lastOperator: null, lastOperand: null,
      history: `${formatNumber(stored ?? current)} ${symbols[action.value]}`,
    };
  }
  if (action.type === 'equals') {
    if (state.error) return { state, summary: '' };
    if (state.operator && state.stored !== null) {
      const right = Number(state.display);
      const result = calculatePair(state.stored, right, state.operator);
      if (result === null) return { state: { ...initialCalc, display: 'Error', error: true }, summary: '' };
      const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
      const history = `${formatNumber(state.stored)} ${symbols[state.operator]} ${formatNumber(right)} =`;
      return {
        state: { ...state, display: formatNumber(result), stored: null, operator: null, replace: true, lastOperator: state.operator, lastOperand: right, history },
        summary: history,
      };
    }
    if (state.lastOperator && state.lastOperand !== null) {
      const current = Number(state.display);
      const result = calculatePair(current, state.lastOperand, state.lastOperator);
      if (result === null) return { state: { ...initialCalc, display: 'Error', error: true }, summary: '' };
      const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
      const history = `${formatNumber(current)} ${symbols[state.lastOperator]} ${formatNumber(state.lastOperand)} =`;
      return {
        state: { ...state, display: formatNumber(result), replace: true, history },
        summary: history,
      };
    }
    return { state, summary: '' };
  }
  return state;
}

function App() {
  const savedSettings = useMemo(() => readStorage('settings', {}), []);
  const [theme, setTheme] = useState(savedSettings.theme === 'light' ? 'light' : 'dark');
  const [language, setLanguage] = useState(savedSettings.language === 'en' ? 'en' : 'ru');
  const [page, setPage] = useState('calculator');
  const [menuOpen, setMenuOpen] = useState(false);
  const [calc, setCalc] = useState(initialCalc);
  const [history, setHistory] = useState(() => readStorage('history', []));
  const [message, setMessage] = useState('');
  const [currencyAmount, setCurrencyAmount] = useState('1');
  const [currencyFrom, setCurrencyFrom] = useState('USD');
  const [currencyTo, setCurrencyTo] = useState('EUR');
  const [currencyResult, setCurrencyResult] = useState('');
  const [currencyBusy, setCurrencyBusy] = useState(false);
  const [mathInput, setMathInput] = useState('2x + 3 = 11');
  const [mathResult, setMathResult] = useState(null);
  const [fuelPrice, setFuelPrice] = useState('90');
  const [fuelCurrency, setFuelCurrency] = useState('KGS');
  const [fuelConsumption, setFuelConsumption] = useState('7.5');
  const [fuelDistance, setFuelDistance] = useState('100');
  const [fuelResult, setFuelResult] = useState(null);
  const t = TEXT[language];
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';

  const addHistory = useCallback((summary) => {
    if (!summary) return;
    const entry = { summary, createdAt: new Date().toISOString() };
    setHistory((previous) => [entry, ...previous].slice(0, 300));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('settings', JSON.stringify({ theme, language }));
      document.documentElement.lang = language;
    } catch {
      setMessage(t.noStorage);
    }
  }, [theme, language, t.noStorage]);

  useEffect(() => {
    try {
      localStorage.setItem('history', JSON.stringify(history));
    } catch {
      setMessage(t.noStorage);
    }
  }, [history, t.noStorage]);

  const navigate = (nextPage) => {
    setPage(nextPage);
    setMenuOpen(false);
    setMessage('');
  };

  const runCalc = (action) => {
    if (action.type === 'equals') {
      const result = calculatorReducer(calc, action);
      setCalc(result.state);
      if (result.summary) addHistory(result.summary);
      return;
    }
    setCalc((current) => calculatorReducer(current, action));
  };

  const calculateCurrency = async () => {
    setMessage('');
    setCurrencyResult('');
    const amount = Number(currencyAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      setMessage(t.enterAmount);
      return;
    }
    if (currencyFrom === currencyTo) {
      const formatted = formatMoney(amount, locale);
      setCurrencyResult(`${formatted} ${currencyTo}`);
      addHistory(`${formatted} ${currencyFrom} → ${formatted} ${currencyTo}`);
      return;
    }

    setCurrencyBusy(true);
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(currencyFrom)}`);
      if (!response.ok) throw new Error('network');
      const data = await response.json();
      const rate = data?.result === 'success' && data?.base_code === currencyFrom ? Number(data.rates?.[currencyTo]) : NaN;
      if (!Number.isFinite(rate) || rate <= 0) throw new Error('rate');
      const converted = amount * rate;
      if (!Number.isFinite(converted)) throw new Error('amount');
      const result = `${formatMoney(converted, locale)} ${currencyTo}`;
      setCurrencyResult(result);
      setMessage(`${t.rate}: 1 ${currencyFrom} = ${formatMoney(rate, locale)} ${currencyTo}`);
      addHistory(`${formatMoney(amount, locale)} ${currencyFrom} → ${result}`);
    } catch (error) {
      setMessage(error.message === 'rate' ? t.badRate : error.message === 'amount' ? t.tooLarge : t.network);
    } finally {
      setCurrencyBusy(false);
    }
  };

  const solveProblem = () => {
    try {
      const result = solveMath(mathInput);
      setMathResult(result);
      addHistory(`${mathInput.trim()} → ${result.answer}`);
    } catch (error) {
      setMathResult({ answer: t.solveError, steps: [error.message || t.solveHelp] });
    }
  };

  const calculateFuel = () => {
    const price = Number(fuelPrice);
    const consumption = Number(fuelConsumption);
    const distance = Number(fuelDistance);
    if (![price, consumption, distance].every(Number.isFinite) || price < 0 || consumption <= 0 || distance < 0) {
      setFuelResult({ answer: t.invalidFuel, detail: t.fuelHelp });
      return;
    }
    const liters = consumption * distance / 100;
    const cost = liters * price;
    if (!Number.isFinite(cost)) {
      setFuelResult({ answer: t.tooLargeResult, detail: '' });
      return;
    }
    const result = {
      answer: `${formatMoney(cost, locale)} ${fuelCurrency}`,
      detail: `${t.fuelNeeded}: ${formatMoney(liters, locale)} L · ${formatMoney(price, locale)} ${fuelCurrency}/L`,
    };
    setFuelResult(result);
    addHistory(`${t.trip}: ${formatMoney(distance, locale)} km, ${formatMoney(liters, locale)} L → ${result.answer}`);
  };

  useEffect(() => {
    if (page !== 'calculator') return undefined;
    const onKeyDown = (event) => {
      if (event.ctrlKey || event.altKey || event.metaKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
      const { key } = event;
      if (/^\d$/.test(key)) runCalc({ type: 'digit', value: key });
      else if (key === '.' || key === ',') runCalc({ type: 'decimal' });
      else if (['+', '-', '*', '/'].includes(key)) runCalc({ type: 'operator', value: key });
      else if (key === 'Enter' || key === '=') runCalc({ type: 'equals' });
      else if (key === 'Escape' || key === 'Delete') runCalc({ type: 'clear' });
      else if (key === 'Backspace') {
        setCalc((current) => current.error || current.replace ? current : {
          ...current,
          display: current.display.length <= 1 || (current.display.length === 2 && current.display.startsWith('-')) ? '0' : current.display.slice(0, -1),
        });
      } else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const navigateItems = [
    ['calculator', '◉', t.calculator],
    ['currency', '⇄', t.currency],
    ['math', 'ƒ', t.math],
    ['fuel', '⌁', t.fuel],
    ['history', '◷', t.history],
  ];

  return (
    <div className={`app-shell theme-${theme}`}>
      <header className="topbar">
        <button className="icon-button menu-button" aria-label={t.menu} onClick={() => setMenuOpen(true)}>☰</button>
        <div className="brand-mark">∑</div>
        <div className="brand-name">{t.title}</div>
        <div className="topbar-spacer" />
        <button className="icon-button" aria-label={t.settings} onClick={() => navigate('settings')}>⚙</button>
      </header>
      <div className="app-body">
        <aside className="sidebar">
          <nav className="nav-list" aria-label={t.title}>
            {navigateItems.map(([id, icon, label]) => (
              <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => navigate(id)}>
                <span>{icon}</span>{label}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <button className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => navigate('settings')}>
              <span>⚙</span>{t.settings}
            </button>
          </div>
        </aside>

        {menuOpen && (
          <div className="mobile-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setMenuOpen(false); }}>
            <aside className="mobile-drawer">
              <div className="drawer-heading">{t.menu}</div>
              {navigateItems.map(([id, icon, label]) => (
                <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => navigate(id)}>
                  <span>{icon}</span>{label}
                </button>
              ))}
              <div className="drawer-divider" />
              <button className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => navigate('settings')}>
                <span>⚙</span>{t.settings}
              </button>
            </aside>
          </div>
        )}

        <main className="main-content">
          {page === 'calculator' && (
            <section className="calculator-page page-enter">
              <div className="calculator-card">
                <h1 className="page-heading">{t.calculator}</h1>
                <div className="calc-display">
                  <div className="calc-history">{calc.history}</div>
                  <div className="calc-value" title={calc.display}>{calc.display}</div>
                </div>
                <div className="keypad">
                  <button className="key key-function" onClick={() => runCalc({ type: 'clear' })}>AC</button>
                  <button className="key key-function" onClick={() => runCalc({ type: 'sign' })}>+/−</button>
                  <button className="key key-function" onClick={() => runCalc({ type: 'percent' })}>%</button>
                  <button className="key key-operator" onClick={() => runCalc({ type: 'operator', value: '/' })}>÷</button>
                  {['7', '8', '9'].map((digit) => <button key={digit} className="key" onClick={() => runCalc({ type: 'digit', value: digit })}>{digit}</button>)}
                  <button className="key key-operator" onClick={() => runCalc({ type: 'operator', value: '*' })}>×</button>
                  {['4', '5', '6'].map((digit) => <button key={digit} className="key" onClick={() => runCalc({ type: 'digit', value: digit })}>{digit}</button>)}
                  <button className="key key-operator" onClick={() => runCalc({ type: 'operator', value: '-' })}>−</button>
                  {['1', '2', '3'].map((digit) => <button key={digit} className="key" onClick={() => runCalc({ type: 'digit', value: digit })}>{digit}</button>)}
                  <button className="key key-operator" onClick={() => runCalc({ type: 'operator', value: '+' })}>+</button>
                  <button className="key key-zero" onClick={() => runCalc({ type: 'digit', value: '0' })}>0</button>
                  <button className="key" onClick={() => runCalc({ type: 'decimal' })}>.</button>
                  <button className="key key-equals" onClick={() => runCalc({ type: 'equals' })}>=</button>
                </div>
              </div>
            </section>
          )}

          {page === 'currency' && (
            <section className="tool-page page-enter">
              <h1>{t.currencyTitle}</h1>
              <p className="subtitle">{t.currencyInfo}</p>
              <div className="form-card">
                <label htmlFor="currency-amount">{t.amount}</label>
                <input id="currency-amount" type="number" min="0" step="any" value={currencyAmount} onChange={(event) => setCurrencyAmount(event.target.value)} />
                <div className="form-grid">
                  <div><label htmlFor="currency-from">{t.from}</label><select id="currency-from" value={currencyFrom} onChange={(event) => setCurrencyFrom(event.target.value)}>{CURRENCIES.map((code) => <option key={code} value={code}>{code} — {CURRENCY_NAMES[language][code]}</option>)}</select></div>
                  <div><label htmlFor="currency-to">{t.to}</label><select id="currency-to" value={currencyTo} onChange={(event) => setCurrencyTo(event.target.value)}>{CURRENCIES.map((code) => <option key={code} value={code}>{code} — {CURRENCY_NAMES[language][code]}</option>)}</select></div>
                </div>
                <button className="primary-button" disabled={currencyBusy} onClick={calculateCurrency}>{currencyBusy ? t.loading : t.convert}</button>
                {currencyResult && <div className="result-value">{currencyResult}</div>}
                {message && <div className="status-message" role="status">{message}</div>}
              </div>
            </section>
          )}

          {page === 'math' && (
            <section className="tool-page page-enter">
              <h1>{t.math}</h1><p className="subtitle">{t.mathInfo}</p>
              <div className="form-card">
                <label htmlFor="math-input">{t.mathInput}</label>
                <input id="math-input" className="large-input" value={mathInput} onChange={(event) => setMathInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') solveProblem(); }} />
                <button className="primary-button" onClick={solveProblem}>{t.solve}</button>
                {mathResult && <><div className="result-value">{mathResult.answer}</div><div className="steps-list">{mathResult.steps.map((step, index) => <div key={`${step}-${index}`}>{step}</div>)}</div></>}
              </div>
            </section>
          )}

          {page === 'fuel' && (
            <section className="tool-page page-enter">
              <h1>{t.fuel}</h1><p className="subtitle">{t.fuelInfo}</p>
              <div className="form-card">
                <div className="form-grid">
                  <div><label htmlFor="fuel-price">{t.fuelPrice}</label><input id="fuel-price" type="number" min="0" step="any" value={fuelPrice} onChange={(event) => setFuelPrice(event.target.value)} /></div>
                  <div><label htmlFor="fuel-currency">{t.fuelCurrency}</label><select id="fuel-currency" value={fuelCurrency} onChange={(event) => setFuelCurrency(event.target.value)}>{CURRENCIES.map((code) => <option key={code} value={code}>{code} — {CURRENCY_NAMES[language][code]}</option>)}</select></div>
                </div>
                <label htmlFor="fuel-consumption">{t.consumption}</label><input id="fuel-consumption" type="number" min="0.01" step="any" value={fuelConsumption} onChange={(event) => setFuelConsumption(event.target.value)} />
                <label htmlFor="fuel-distance">{t.distance}</label><input id="fuel-distance" type="number" min="0" step="any" value={fuelDistance} onChange={(event) => setFuelDistance(event.target.value)} />
                <button className="primary-button" onClick={calculateFuel}>{t.calculate}</button>
                {fuelResult && <><div className="result-value">{fuelResult.answer}</div><div className="status-message">{fuelResult.detail}</div></>}
              </div>
            </section>
          )}

          {page === 'history' && (
            <section className="tool-page page-enter">
              <div className="history-heading"><h1>{t.historyTitle}</h1>{history.length > 0 && <button className="secondary-button" onClick={() => setHistory([])}>{t.clearHistory}</button>}</div>
              {history.length === 0
                ? <div className="empty-state">{t.emptyHistory}</div>
                : <div className="history-list">{history.map((entry, index) => <article className="history-entry" key={`${entry.createdAt}-${index}`}><div>{entry.summary}</div><time>{new Date(entry.createdAt).toLocaleString(locale)}</time></article>)}</div>}
            </section>
          )}

          {page === 'settings' && (
            <section className="tool-page page-enter">
              <h1>{t.settings}</h1>
              <div className="form-card settings-card">
                <label>{t.theme}</label>
                <div className="choice-row">
                  <button className={`choice-button ${theme === 'light' ? 'selected' : ''}`} onClick={() => setTheme('light')}>☀ {t.light}</button>
                  <button className={`choice-button ${theme === 'dark' ? 'selected' : ''}`} onClick={() => setTheme('dark')}>☾ {t.dark}</button>
                </div>
                <label htmlFor="language">{t.language}</label>
                <select id="language" value={language} onChange={(event) => setLanguage(event.target.value)}><option value="ru">Русский</option><option value="en">English</option></select>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function formatMoney(value, locale) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}

export default App;
