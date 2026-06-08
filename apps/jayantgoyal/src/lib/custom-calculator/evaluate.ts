const PRECEDENCE: Record<string, number> = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
  "%": 2,
}

function applyOperator(values: number[], operator: string) {
  const right = values.pop()
  const left = values.pop()

  if (left === undefined || right === undefined) {
    throw new Error("Invalid expression")
  }

  switch (operator) {
    case "+":
      values.push(left + right)
      return
    case "-":
      values.push(left - right)
      return
    case "*":
      values.push(left * right)
      return
    case "/":
      if (right === 0) throw new Error("Division by zero")
      values.push(left / right)
      return
    case "%":
      if (right === 0) throw new Error("Division by zero")
      values.push(left % right)
      return
    default:
      throw new Error("Unsupported operator")
  }
}

function isOperator(value: string) {
  return Object.prototype.hasOwnProperty.call(PRECEDENCE, value)
}

export function evaluateCalculatorExpression(expression: string) {
  const input = expression.replace(/\s+/g, "")
  if (!input) throw new Error("Invalid expression")
  if (!/^[0-9+\-*/%.()]+$/.test(input)) throw new Error("Invalid expression")

  const values: number[] = []
  const operators: string[] = []
  let index = 0
  let expectsValue = true

  while (index < input.length) {
    const char = input[index]

    if (!char) break

    if (char === "(") {
      operators.push(char)
      expectsValue = true
      index += 1
      continue
    }

    if (char === ")") {
      while (operators.length && operators[operators.length - 1] !== "(") {
        applyOperator(values, operators.pop()!)
      }
      if (operators.pop() !== "(") throw new Error("Invalid expression")
      expectsValue = false
      index += 1
      continue
    }

    const isSignedNumber =
      expectsValue &&
      (char === "-" || char === "+") &&
      /[0-9.]/.test(input[index + 1] ?? "")
    if (/[0-9.]/.test(char) || isSignedNumber) {
      const start = index
      index += isSignedNumber ? 1 : 0
      while (/[0-9.]/.test(input[index] ?? "")) index += 1

      const rawNumber = input.slice(start, index)
      if ((rawNumber.match(/\./g) ?? []).length > 1) throw new Error("Invalid expression")
      const value = Number(rawNumber)
      if (!Number.isFinite(value)) throw new Error("Invalid expression")
      values.push(value)
      expectsValue = false
      continue
    }

    if (isOperator(char)) {
      if (expectsValue) throw new Error("Invalid expression")
      const currentPrecedence = PRECEDENCE[char]
      if (currentPrecedence === undefined) throw new Error("Invalid expression")
      while (
        operators.length &&
        isOperator(operators[operators.length - 1]!) &&
        (PRECEDENCE[operators[operators.length - 1]!] ?? 0) >= currentPrecedence
      ) {
        applyOperator(values, operators.pop()!)
      }
      operators.push(char)
      expectsValue = true
      index += 1
      continue
    }

    throw new Error("Invalid expression")
  }

  if (expectsValue) throw new Error("Invalid expression")

  while (operators.length) {
    const operator = operators.pop()!
    if (operator === "(") throw new Error("Invalid expression")
    applyOperator(values, operator)
  }

  const finalValue = values[0]
  if (values.length !== 1 || finalValue === undefined || !Number.isFinite(finalValue)) {
    throw new Error("Invalid expression")
  }

  return finalValue
}
