import { createToolReference } from "./create-tool-reference";
import type { ToolReferenceRegistry } from "./types";

export const calculatorToolReferences = {
  "/tools/calculators/math-evaluator": createToolReference(
    "/tools/calculators/math-evaluator",
    {
      summary:
        "Evaluate mathematical expressions with supported arithmetic operators, constants, and functions for quick calculations and development checks.",
      useCases: [
        "Check an expression without opening a full spreadsheet.",
        "Test sample formulas used in an application.",
      ],
      examples: [
        "Evaluate sqrt(144) + 8.",
        "Compare trigonometric output for a test angle.",
      ],
      considerations:
        "Confirm operator precedence, angle units, supported functions, numeric precision, and whether the result needs domain-specific rounding.",
    },
  ),
  "/tools/calculators/eta-calculator": createToolReference(
    "/tools/calculators/eta-calculator",
    {
      summary:
        "Estimate completion time from progress, elapsed time, or transfer-rate inputs while monitoring downloads, jobs, and repeatable tasks.",
      useCases: [
        "Estimate when a long-running local task may finish.",
        "Check the remaining duration shown by a progress interface.",
      ],
      examples: [
        "Estimate a download finish time from completed bytes and elapsed time.",
        "Calculate remaining duration for a batch-processing job.",
      ],
      considerations:
        "ETA assumes future speed resembles observed speed. Network variation, startup cost, retries, pauses, and nonlinear work can make the estimate inaccurate.",
    },
  ),
  "/tools/calculators/percentage-calculator": createToolReference(
    "/tools/calculators/percentage-calculator",
    {
      summary:
        "Calculate percentages, percentage change, and the value represented by a percentage for everyday comparisons and data checks.",
      useCases: [
        "Check a discount, increase, or completion percentage.",
        "Translate a part and total into a percentage.",
      ],
      examples: [
        "Calculate 18 percent of 250.",
        "Find the percentage change from 80 to 100.",
      ],
      considerations:
        "Choose the correct base value and distinguish percentage points from percent change. Apply required financial or reporting rounding separately.",
    },
  ),
  "/tools/calculators/chronometer": createToolReference(
    "/tools/calculators/chronometer",
    {
      summary:
        "Measure elapsed time with a simple browser chronometer for informal tasks, experiments, and workflow observations.",
      useCases: [
        "Time a manual development or review task.",
        "Capture rough duration for a repeatable activity.",
      ],
      examples: [
        "Measure how long a local build takes.",
        "Time a short usability exercise.",
      ],
      considerations:
        "Browser throttling, sleeping devices, tab suspension, and manual start or stop timing can affect precision. Use dedicated instrumentation for formal benchmarks.",
    },
  ),
} satisfies ToolReferenceRegistry;
