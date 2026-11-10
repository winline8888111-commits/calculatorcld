const format = (value) => Number(value.toPrecision(12)).toString();

class PolynomialParser {
  constructor(input) {
    const normalized = input
      .replaceAll('×', '*')
      .replaceAll('÷', '/')
      .replaceAll('−', '-')
      .replaceAll(',', '.');
    const pattern = /(?:\d+(?:\.\d*)?|\.\d+)|[xX]|[+\-*/^()]/g;
    const tokens = normalized.match(pattern) ?? [];
    if (normalized.replace(pattern, '').trim()) throw new Error('The expression contains an unsupported character.');
    this.tokens = tokens;
    this.position = 0;
  }

  parse() {
    if (!this.tokens.length) throw new Error('Enter a mathematical expression.');
    const result = this.expression();
    if (this.position !== this.tokens.length) throw new Error(`Unexpected token "${this.tokens[this.position]}".`);
    return result;
  }

  expression() {
    let value = this.term();
    while (this.peek() === '+' || this.peek() === '-') {
      const operator = this.take();
      const right = this.term();
      value = operator === '+' ? add(value, right) : subtract(value, right);
    }
    return value;
  }

  term() {
    let value = this.unary();
    while (true) {
      const token = this.peek();
      if (token === '*') {
        this.take();
        value = multiply(value, this.unary());
      } else if (token === '/') {
        this.take();
        value = divide(value, this.unary());
      } else if (token === 'x' || token === 'X' || token === '(' || isNumber(token)) {
        value = multiply(value, this.unary());
      } else {
        return value;
      }
    }
  }

  unary() {
    if (this.peek() === '+') {
      this.take();
      return this.unary();
    }
    if (this.peek() === '-') {
      this.take();
      return scale(this.unary(), -1);
    }
    return this.power();
  }

  power() {
    const value = this.primary();
    if (this.peek() !== '^') return value;
    this.take();
    const exponent = this.take();
    if (!['0', '1', '2'].includes(exponent)) throw new Error('Only powers 0, 1, and 2 are supported.');
    if (this.peek() && /^\d/.test(this.peek())) throw new Error('Only powers 0, 1, and 2 are supported.');
    return polynomialPower(value, Number(exponent));
  }

  primary() {
    const token = this.take();
    if (token === '(') {
      const value = this.expression();
      if (this.take() !== ')') throw new Error('A closing parenthesis is missing.');
      return value;
    }
    if (token === 'x' || token === 'X') return [0, 1, 0];
    if (isNumber(token)) return [Number(token), 0, 0];
    throw new Error('Enter a valid number or expression.');
  }

  peek() {
    return this.tokens[this.position];
  }

  take() {
    return this.tokens[this.position++];
  }
}

const isNumber = (token) => typeof token === 'string' && /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token);
const add = (a, b) => a.map((value, index) => value + b[index]);
const subtract = (a, b) => a.map((value, index) => value - b[index]);
const scale = (value, factor) => value.map((item) => item * factor);

function multiply(a, b) {
  const result = [0, 0, 0];
  for (let i = 0; i <= 2; i++) {
    for (let j = 0; j <= 2; j++) {
      const coefficient = a[i] * b[j];
      if (i + j > 2 && coefficient !== 0) throw new Error('Only linear and quadratic equations are supported.');
      if (i + j <= 2) result[i + j] += coefficient;
    }
  }
  return result;
}

function divide(a, b) {
  if (b[1] !== 0 || b[2] !== 0 || b[0] === 0) throw new Error('Division by zero or by a variable expression is not supported.');
  return scale(a, 1 / b[0]);
}

function polynomialPower(value, exponent) {
  if (exponent === 0) return [1, 0, 0];
  if (exponent === 1) return value;
  return multiply(value, value);
}

export function solveMath(input) {
  const parts = input.split('=');
  if (parts.length > 2 || parts.some((part) => !part.trim())) {
    throw new Error('Enter one complete equation at a time.');
  }

  if (parts.length === 1) {
    const expression = new PolynomialParser(parts[0]).parse();
    if (expression[1] !== 0 || expression[2] !== 0) throw new Error('Use an equation with "=" to solve for x.');
    return { answer: format(expression[0]), steps: [`${input.trim()} = ${format(expression[0])}`] };
  }

  const left = new PolynomialParser(parts[0]).parse();
  const right = new PolynomialParser(parts[1]).parse();
  const [c, b, a] = subtract(left, right);
  const steps = [`Start with: ${parts[0].trim()} = ${parts[1].trim()}`];

  if (a === 0) {
    if (b === 0) {
      if (c === 0) return { answer: 'Every real number is a solution.', steps: [...steps, 'Both sides are identical.'] };
      return { answer: 'No solution.', steps: [...steps, 'The equation reduces to a false statement.'] };
    }
    const root = -c / b;
    return {
      answer: `x = ${format(root)}`,
      steps: [...steps, `${format(b)}x + ${format(c)} = 0`, `x = −(${format(c)}) / ${format(b)}`, `x = ${format(root)}`],
    };
  }

  const discriminant = b * b - 4 * a * c;
  const stepsForQuadratic = [
    ...steps,
    `${format(a)}x² + ${format(b)}x + ${format(c)} = 0`,
    `D = b² − 4ac = ${format(b)}² − 4 × ${format(a)} × ${format(c)} = ${format(discriminant)}`,
  ];
  if (discriminant < 0) return { answer: 'No real solutions.', steps: [...stepsForQuadratic, 'The discriminant is negative.'] };

  const first = (-b + Math.sqrt(discriminant)) / (2 * a);
  if (discriminant === 0) return { answer: `x = ${format(first)}`, steps: [...stepsForQuadratic, `x = ${format(first)}`] };
  const second = (-b - Math.sqrt(discriminant)) / (2 * a);
  return {
    answer: `x₁ = ${format(first)}, x₂ = ${format(second)}`,
    steps: [...stepsForQuadratic, `x₁ = ${format(first)}`, `x₂ = ${format(second)}`],
  };
}
