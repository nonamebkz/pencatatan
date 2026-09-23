/** Join advice steps for textarea display (one step per line). */
export function linesFromSteps(steps: string[]) {
  return steps.join('\n')
}

/** Split textarea lines into trimmed non-empty advice steps. */
export function stepsFromLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}
