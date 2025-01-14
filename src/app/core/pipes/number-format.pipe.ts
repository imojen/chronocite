import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberFormat',
  standalone: true,
})
export class NumberFormatPipe implements PipeTransform {
  transform(value: number): string {
    if (value === 0) return '0';

    const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];
    const order = Math.floor(Math.log10(Math.abs(value)) / 3);

    if (order < 0) return value.toFixed(2);
    if (order >= suffixes.length) return value.toExponential(2);

    const suffix = suffixes[order];
    const scaled = value / Math.pow(1000, order);

    return scaled.toFixed(2) + suffix;
  }
}
