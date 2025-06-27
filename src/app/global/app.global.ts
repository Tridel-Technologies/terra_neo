export class GlobalConfig {
  baseUrl: string = 'http://192.168.0.163:3000/api/';

  convertValue(value: number, fromUnit: string, toUnit: string): any {
    if (fromUnit === toUnit) return value;

    const maxVolt = 4.2; // for battery conversion

    const conversions: { [key: string]: (v: any) => number | string } = {
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
      'dd-dms': (v) => {
        const deg = Math.floor(v);
        const minFloat = (v - deg) * 60;
        const min = Math.floor(minFloat);
        const sec = (minFloat - min) * 60;
        return `${deg}°${min}'${sec.toFixed(2)}"`;
      },
      'dms-dd': (v) => {
        const regex = /(\d+)°(\d+)'([\d.]+)"/;
        const match = v.match(regex);
        if (!match) return 0;
        const deg = parseInt(match[1]);
        const min = parseInt(match[2]);
        const sec = parseFloat(match[3]);
        return parseFloat((deg + min / 60 + sec / 3600).toFixed(6));
      },
    };

    const key = `${fromUnit}-${toUnit}`;
    let result = conversions[key] ? conversions[key](value) : value;

    // Decimal conversion
    if (typeof result === 'number') {
      result = parseFloat(result.toFixed(4));
    }

    return result;
  }
}
