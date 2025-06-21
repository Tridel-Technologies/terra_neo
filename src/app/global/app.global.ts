export class GlobalConfig {
  baseUrl: string = 'http://localhost:3000/api/';




  convertValue(value: number, fromUnit: string, toUnit: string): number {
    if (fromUnit === toUnit) return value;
  
    const maxVolt = 4.2; // for battery conversion
  
    const conversions: { [key: string]: (v: number) => number } = {
      'm-ft': (v) => v * 3.28084,
      'ft-m': (v) => v / 3.28084,
      'm-cm': (v) => v * 100,
      'cm-m': (v) => v / 100,
      'ft-cm': (v) => (v / 3.28084) * 100,
      'cm-ft': (v) => (v / 100) * 3.28084,
      'm/s-knots': (v) => v * 1.94384,
      'knots-m/s': (v) => v / 1.94384,
      'radians-°': (v) => v * (180 / Math.PI),
      '°-radians': (v) => v * (Math.PI / 180),
      'volts-%': (v) => (v / maxVolt) * 100,
      '%-volts': (v) => (v * maxVolt) / 100,
    };
  
    const key = `${fromUnit}-${toUnit}`;
    if (conversions[key]) {
      return conversions[key](value);
    }
  
    // no conversion available
    return value;
  }  
}
