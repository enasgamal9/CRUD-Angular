import { Component } from '@angular/core';

@Component({
  selector: 'app-loader',
  template: `
    <div class="overlay">
      <div class="loader"></div>
    </div>
  `,
  styleUrls: ['./loader.component.css'],
})
export class LoaderComponent {}
