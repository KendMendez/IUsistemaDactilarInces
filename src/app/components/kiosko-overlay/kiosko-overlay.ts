import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KioskoService } from '../../services/kiosko';

@Component({
  selector: 'app-kiosko-overlay',
  imports: [CommonModule],
  templateUrl: './kiosko-overlay.html',
  styles: ``,
})
export class KioskoOverlay {
  constructor(public kiosko: KioskoService) {}
}
