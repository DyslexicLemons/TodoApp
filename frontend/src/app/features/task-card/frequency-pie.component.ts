import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-frequency-pie',
  standalone: true,
  templateUrl: './frequency-pie.component.html',
  styleUrl: './frequency-pie.component.scss'
})
export class FrequencyPieComponent {
  @Input({ required: true }) completed!: number;
  @Input({ required: true }) target!: number;
  @Input() label = '';

  get fillDegrees(): number {
    const fraction = this.target > 0 ? Math.min(this.completed / this.target, 1) : 0;
    return fraction * 360;
  }
}
