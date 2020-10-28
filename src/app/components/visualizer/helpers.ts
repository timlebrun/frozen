import { IFrozenColor } from 'src/interfaces/color.interface';


/**
 * Takes two number arrys and generates a fade between them
 * 
 * @param startValues 
 * @param endValues 
 * @param numberOfSteps 
 */
function generateNumberArraySteps(startValues: number[], endValues: number[], numberOfSteps: number): Array<number[]> {
  if (startValues.length !== endValues.length) throw new Error();

  const stepsToProcess = numberOfSteps - 2; // Excludes first and last element

  const numberDifferences = startValues.map((value, i) => endValues[i] - value);
  const numberSteps = numberDifferences.map(numberDifference => numberDifference / numberOfSteps);

  const output = [];

  output.push(startValues);
  for (let step = 0; step < stepsToProcess; step++) {
    const stepArray = startValues.map((number, i) => number + (numberSteps[i] * step));
    output.push(stepArray);
  }
  output.push(endValues);

  return output;
}

/**
 * Given 2 colors and a number of steps, generates an array of inbetween colors
 * 
 * @param startColor 
 * @param endColor 
 * @param numberOfSteps 
 */
export function generateGradient(startColor: IFrozenColor, endColor: IFrozenColor, numberOfSteps: number): IFrozenColor[] {

  const startColorArray = [startColor.red, startColor.green, startColor.blue];
  const endColorArray = [endColor.red, endColor.green, endColor.blue];

  const colorArrayGradient = generateNumberArraySteps(startColorArray, endColorArray, numberOfSteps);

  return colorArrayGradient.map(([red, green, blue]) => ({ red, green, blue }));
}
