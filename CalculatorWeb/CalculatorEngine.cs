using System.Globalization;

namespace CalculatorWeb;

internal sealed class CalculatorEngine
{
    private const int MaximumInputLength = 30;

    private string _currentInput = "0";
    private decimal? _storedValue;
    private decimal? _lastOperand;
    private char? _pendingOperator;
    private char? _lastOperator;
    private bool _replaceInput = true;
    private bool _hasError;

    public string Display => _hasError ? "Error" : _currentInput;

    public string History { get; private set; } = string.Empty;

    public void InputDigit(char digit)
    {
        if (!char.IsAsciiDigit(digit))
        {
            return;
        }

        PrepareForInput();
        var candidate = _replaceInput
            ? digit.ToString()
            : _currentInput == "0"
                ? digit.ToString()
                : _currentInput + digit;

        if (candidate.Length <= MaximumInputLength && IsValidInput(candidate))
        {
            _currentInput = candidate;
            _replaceInput = false;
            ClearRepeatOperation();
        }
    }

    public void InputDecimalSeparator()
    {
        PrepareForInput();

        if (_replaceInput)
        {
            _currentInput = "0.";
            _replaceInput = false;
            ClearRepeatOperation();
            return;
        }

        if (!_currentInput.Contains('.'))
        {
            _currentInput += ".";
            ClearRepeatOperation();
        }
    }

    public void Clear()
    {
        _currentInput = "0";
        _storedValue = null;
        _lastOperand = null;
        _pendingOperator = null;
        _lastOperator = null;
        _replaceInput = true;
        _hasError = false;
        History = string.Empty;
    }

    public void ToggleSign()
    {
        if (_hasError || !TryParseCurrent(out var value) || value == 0)
        {
            return;
        }

        _currentInput = _currentInput.StartsWith("-", StringComparison.Ordinal)
            ? _currentInput[1..]
            : "-" + _currentInput;
        _replaceInput = false;
        ClearRepeatOperation();
    }

    public void ApplyPercent()
    {
        if (_hasError || _replaceInput || !TryParseCurrent(out var value))
        {
            return;
        }

        try
        {
            var percent = value / 100m;
            if (_pendingOperator is '+' or '-' && _storedValue is decimal storedValue)
            {
                percent = storedValue * percent;
            }

            SetCurrentValue(percent);
            ClearRepeatOperation();
        }
        catch (OverflowException)
        {
            SetError();
        }
    }

    public void SetOperator(char operation)
    {
        if (operation is not ('+' or '-' or '*' or '/'))
        {
            return;
        }

        if (_hasError)
        {
            return;
        }

        if (!TryParseCurrent(out var currentValue))
        {
            return;
        }

        if (_pendingOperator is not null && !_replaceInput)
        {
            if (!TryPerformOperation(_storedValue ?? currentValue, currentValue, _pendingOperator.Value, out var result))
            {
                SetError();
                return;
            }

            SetCurrentValue(result);
            _storedValue = result;
        }
        else if (_pendingOperator is null)
        {
            _storedValue = currentValue;
        }

        _pendingOperator = operation;
        _replaceInput = true;
        _lastOperand = null;
        _lastOperator = null;
        History = $"{FormatNumber(_storedValue ?? currentValue)} {GetOperatorSymbol(operation)}";
    }

    public void Calculate()
    {
        if (_hasError)
        {
            return;
        }

        if (_pendingOperator is char pendingOperator && _storedValue is decimal storedValue)
        {
            if (!TryParseCurrent(out var rightValue)
                || !TryPerformOperation(storedValue, rightValue, pendingOperator, out var result))
            {
                SetError();
                return;
            }

            History = $"{FormatNumber(storedValue)} {GetOperatorSymbol(pendingOperator)} {FormatNumber(rightValue)} =";
            SetCurrentValue(result);
            _lastOperand = rightValue;
            _lastOperator = pendingOperator;
            _storedValue = null;
            _pendingOperator = null;
            _replaceInput = true;
            return;
        }

        if (_lastOperator is char lastOperator && _lastOperand is decimal lastOperand
            && TryParseCurrent(out var currentValue)
            && TryPerformOperation(currentValue, lastOperand, lastOperator, out var repeatResult))
        {
            History = $"{FormatNumber(currentValue)} {GetOperatorSymbol(lastOperator)} {FormatNumber(lastOperand)} =";
            SetCurrentValue(repeatResult);
            _replaceInput = true;
        }
    }

    public void Backspace()
    {
        if (_hasError || _replaceInput)
        {
            return;
        }

        _currentInput = _currentInput.Length <= 1
            || _currentInput.Length == 2 && _currentInput.StartsWith("-", StringComparison.Ordinal)
                ? "0"
                : _currentInput[..^1];
        ClearRepeatOperation();
    }

    private void PrepareForInput()
    {
        if (!_hasError)
        {
            return;
        }

        Clear();
    }

    private void SetCurrentValue(decimal value)
    {
        _currentInput = FormatNumber(value);
        _hasError = false;
    }

    private void SetError()
    {
        _currentInput = "Error";
        _storedValue = null;
        _lastOperand = null;
        _pendingOperator = null;
        _lastOperator = null;
        _replaceInput = true;
        _hasError = true;
        History = string.Empty;
    }

    private void ClearRepeatOperation()
    {
        _lastOperand = null;
        _lastOperator = null;
        if (_pendingOperator is null)
        {
            History = string.Empty;
        }
    }

    private bool TryParseCurrent(out decimal value)
    {
        return decimal.TryParse(
            _currentInput,
            NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint,
            CultureInfo.InvariantCulture,
            out value);
    }

    private static bool IsValidInput(string input)
    {
        return decimal.TryParse(
            input,
            NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint,
            CultureInfo.InvariantCulture,
            out _);
    }

    private static bool TryPerformOperation(decimal left, decimal right, char operation, out decimal result)
    {
        result = 0;
        if (operation == '/' && right == 0)
        {
            return false;
        }

        try
        {
            result = operation switch
            {
                '+' => left + right,
                '-' => left - right,
                '*' => left * right,
                '/' => left / right,
                _ => throw new ArgumentOutOfRangeException(nameof(operation))
            };
            return true;
        }
        catch (OverflowException)
        {
            return false;
        }
    }

    private static string FormatNumber(decimal value)
    {
        return value.ToString("G29", CultureInfo.InvariantCulture);
    }

    private static string GetOperatorSymbol(char operation)
    {
        return operation switch
        {
            '*' => "×",
            '/' => "÷",
            '-' => "−",
            _ => "+"
        };
    }
}
