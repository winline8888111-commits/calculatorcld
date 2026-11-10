using System.Globalization;

namespace CalculatorWeb;

internal sealed record MathSolution(string Answer, IReadOnlyList<string> Steps);

internal static class MathSolver
{
    public static MathSolution Solve(string input)
    {
        var equalsIndex = input.IndexOf('=');
        if (equalsIndex < 0)
        {
            var expression = new ExpressionParser(input).Parse();
            if (expression.Linear != 0 || expression.Quadratic != 0)
            {
                throw new FormatException("An equation is required to solve for x.");
            }

            var value = expression.Constant;
            return new MathSolution(
                Format(value),
                [$"{input.Trim()} = {Format(value)}"]);
        }

        if (input.IndexOf('=', equalsIndex + 1) >= 0)
        {
            throw new FormatException("Enter one equation at a time.");
        }

        var leftText = input[..equalsIndex].Trim();
        var rightText = input[(equalsIndex + 1)..].Trim();
        if (leftText.Length == 0 || rightText.Length == 0)
        {
            throw new FormatException("Both sides of the equation are required.");
        }

        var left = new ExpressionParser(leftText).Parse();
        var right = new ExpressionParser(rightText).Parse();
        var equation = left - right;
        return SolveEquation(leftText, rightText, left, right, equation);
    }

    private static MathSolution SolveEquation(
        string leftText,
        string rightText,
        Polynomial left,
        Polynomial right,
        Polynomial equation)
    {
        var steps = new List<string>
        {
            $"Start with: {leftText} = {rightText}",
            $"Move everything to the left: {FormatPolynomial(equation)} = 0"
        };

        if (equation.Quadratic == 0)
        {
            if (equation.Linear == 0)
            {
                if (equation.Constant == 0)
                {
                    return new MathSolution("Every real number is a solution.", [.. steps, "Both sides are identical."]);
                }

                return new MathSolution("No solution.", [.. steps, "The equation reduces to a false statement."]);
            }

            var root = -equation.Constant / equation.Linear;
            steps.Add($"Isolate x: x = {Format(-equation.Constant)} / {Format(equation.Linear)}");
            steps.Add($"x = {Format(root)}");
            return new MathSolution($"x = {Format(root)}", steps);
        }

        var a = equation.Quadratic;
        var b = equation.Linear;
        var c = equation.Constant;
        var discriminant = b * b - 4m * a * c;
        steps.Add($"Quadratic formula: x = (−b ± √D) / (2a), where D = b² − 4ac");
        steps.Add($"a = {Format(a)}, b = {Format(b)}, c = {Format(c)}");
        steps.Add($"D = {Format(b)}² − 4 × {Format(a)} × {Format(c)} = {Format(discriminant)}");

        if (discriminant < 0)
        {
            return new MathSolution("No real solutions.", [.. steps, "The discriminant is negative."]);
        }

        var squareRoot = (decimal)Math.Sqrt((double)discriminant);
        var denominator = 2m * a;
        var firstRoot = (-b + squareRoot) / denominator;
        if (discriminant == 0)
        {
            steps.Add($"x = {Format(firstRoot)}");
            return new MathSolution($"x = {Format(firstRoot)}", steps);
        }

        var secondRoot = (-b - squareRoot) / denominator;
        steps.Add($"x₁ = {Format(firstRoot)}");
        steps.Add($"x₂ = {Format(secondRoot)}");
        return new MathSolution($"x₁ = {Format(firstRoot)}, x₂ = {Format(secondRoot)}", steps);
    }

    private static string FormatPolynomial(Polynomial polynomial)
    {
        var terms = new List<string>();
        if (polynomial.Quadratic != 0)
        {
            terms.Add($"{Format(polynomial.Quadratic)}x²");
        }

        if (polynomial.Linear != 0)
        {
            terms.Add($"{(polynomial.Linear > 0 && terms.Count > 0 ? "+" : string.Empty)}{Format(polynomial.Linear)}x");
        }

        if (polynomial.Constant != 0 || terms.Count == 0)
        {
            terms.Add($"{(polynomial.Constant > 0 && terms.Count > 0 ? "+" : string.Empty)}{Format(polynomial.Constant)}");
        }

        return string.Join(" ", terms);
    }

    private static string Format(decimal value) => value.ToString("G29", CultureInfo.InvariantCulture);

    private readonly record struct Polynomial(decimal Constant, decimal Linear, decimal Quadratic)
    {
        public static Polynomial operator +(Polynomial left, Polynomial right) =>
            new(left.Constant + right.Constant, left.Linear + right.Linear, left.Quadratic + right.Quadratic);

        public static Polynomial operator -(Polynomial left, Polynomial right) =>
            new(left.Constant - right.Constant, left.Linear - right.Linear, left.Quadratic - right.Quadratic);

        public static Polynomial operator -(Polynomial value) =>
            new(-value.Constant, -value.Linear, -value.Quadratic);

        public static Polynomial operator *(Polynomial left, Polynomial right)
        {
            var c0 = left.Constant * right.Constant;
            var c1 = left.Constant * right.Linear + left.Linear * right.Constant;
            var c2 = left.Constant * right.Quadratic + left.Linear * right.Linear + left.Quadratic * right.Constant;
            var c3 = left.Linear * right.Quadratic + left.Quadratic * right.Linear;
            var c4 = left.Quadratic * right.Quadratic;
            if (c3 != 0 || c4 != 0)
            {
                throw new FormatException("Only linear and quadratic equations are supported.");
            }

            return new Polynomial(c0, c1, c2);
        }

        public static Polynomial operator /(Polynomial left, Polynomial right)
        {
            if (right.Linear != 0 || right.Quadratic != 0 || right.Constant == 0)
            {
                throw new FormatException("Division by a variable expression is not supported.");
            }

            return new Polynomial(
                left.Constant / right.Constant,
                left.Linear / right.Constant,
                left.Quadratic / right.Constant);
        }

        public static Polynomial Pow(Polynomial value, int exponent)
        {
            return exponent switch
            {
                0 => new Polynomial(1, 0, 0),
                1 => value,
                2 => value * value,
                _ => throw new FormatException("Only powers 0, 1, and 2 are supported.")
            };
        }
    }

    private sealed class ExpressionParser
    {
        private readonly string _input;
        private int _position;

        public ExpressionParser(string input)
        {
            _input = input.Replace('×', '*').Replace('÷', '/').Replace('−', '-').Replace(',', '.');
        }

        public Polynomial Parse()
        {
            var result = ParseExpression();
            SkipWhitespace();
            if (_position != _input.Length)
            {
                throw new FormatException($"Unexpected character '{_input[_position]}'.");
            }

            return result;
        }

        private Polynomial ParseExpression()
        {
            var value = ParseTerm();
            while (true)
            {
                SkipWhitespace();
                if (Take('+'))
                {
                    value += ParseTerm();
                }
                else if (Take('-'))
                {
                    value -= ParseTerm();
                }
                else
                {
                    return value;
                }
            }
        }

        private Polynomial ParseTerm()
        {
            var value = ParseUnary();
            while (true)
            {
                SkipWhitespace();
                if (Take('*'))
                {
                    value *= ParseUnary();
                }
                else if (Take('/'))
                {
                    value /= ParseUnary();
                }
                else if (StartsPrimary())
                {
                    value *= ParseUnary();
                }
                else
                {
                    return value;
                }
            }
        }

        private Polynomial ParseUnary()
        {
            SkipWhitespace();
            if (Take('+'))
            {
                return ParseUnary();
            }

            if (Take('-'))
            {
                return -ParseUnary();
            }

            return ParsePower();
        }

        private Polynomial ParsePower()
        {
            var value = ParsePrimary();
            SkipWhitespace();
            if (!Take('^'))
            {
                return value;
            }

            SkipWhitespace();
            if (_position >= _input.Length || !char.IsAsciiDigit(_input[_position]))
            {
                throw new FormatException("The exponent must be 0, 1, or 2.");
            }

            var exponent = _input[_position++] - '0';
            if (_position < _input.Length && char.IsAsciiDigit(_input[_position]))
            {
                throw new FormatException("The exponent must be 0, 1, or 2.");
            }

            return Polynomial.Pow(value, exponent);
        }

        private Polynomial ParsePrimary()
        {
            SkipWhitespace();
            if (Take('('))
            {
                var value = ParseExpression();
                SkipWhitespace();
                if (!Take(')'))
                {
                    throw new FormatException("A closing parenthesis is missing.");
                }

                return value;
            }

            if (_position < _input.Length && char.ToLowerInvariant(_input[_position]) == 'x')
            {
                _position++;
                return new Polynomial(0, 1, 0);
            }

            return ParseNumber();
        }

        private Polynomial ParseNumber()
        {
            SkipWhitespace();
            var start = _position;
            var hasDecimalPoint = false;
            while (_position < _input.Length)
            {
                var character = _input[_position];
                if (char.IsAsciiDigit(character))
                {
                    _position++;
                }
                else if (character == '.' && !hasDecimalPoint)
                {
                    hasDecimalPoint = true;
                    _position++;
                }
                else
                {
                    break;
                }
            }

            if (start == _position
                || !decimal.TryParse(
                    _input[start.._position],
                    NumberStyles.AllowDecimalPoint,
                    CultureInfo.InvariantCulture,
                    out var number))
            {
                throw new FormatException("Enter a valid number or expression.");
            }

            return new Polynomial(number, 0, 0);
        }

        private bool StartsPrimary()
        {
            SkipWhitespace();
            return _position < _input.Length
                && (_input[_position] == '('
                    || char.ToLowerInvariant(_input[_position]) == 'x'
                    || char.IsAsciiDigit(_input[_position])
                    || _input[_position] == '.');
        }

        private bool Take(char character)
        {
            if (_position < _input.Length && _input[_position] == character)
            {
                _position++;
                return true;
            }

            return false;
        }

        private void SkipWhitespace()
        {
            while (_position < _input.Length && char.IsWhiteSpace(_input[_position]))
            {
                _position++;
            }
        }
    }
}
