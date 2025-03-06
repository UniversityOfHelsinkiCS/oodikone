const interpolateColor = (color1: number[], color2: number[], factor: number) => {
  return color1.map((component, index) => Math.round(component + factor * (color2[index] - component)))
}

const convertRgbToHex = (rgb: number[]) => `#${rgb.map(x => x.toString(16).padStart(2, '0')).join('')}`

export const generateGradientColors = (steps: number) => {
  const startColor = [230, 96, 103] // red
  const midColor = [245, 233, 132] // yellow
  const endColor = [0, 140, 89] // green

  const gradientColors: string[] = []

  for (let i = 0; i < steps; i++) {
    const factor = i / (steps - 1)
    let color: number[]

    if (i <= (steps - 1) / 2) {
      color = interpolateColor(startColor, midColor, factor * 2)
    } else {
      color = interpolateColor(midColor, endColor, (factor - 0.5) * 2)
    }

    gradientColors.push(convertRgbToHex(color))
  }

  return gradientColors
}
