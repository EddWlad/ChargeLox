import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-public-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="public-layout">
      <header class="public-header container">
        <a routerLink="/" class="brand-link" aria-label="Inicio ChargeLox">
          <span class="brand-mark" aria-hidden="true">
            <span class="brand-mark-dot"></span>
            <span class="brand-mark-line"></span>
            <span class="brand-mark-bolt">⚡</span>
          </span>
          <span>
            <strong>ChargeLox</strong>
            <small>Monitoreo inteligente de red</small>
          </span>
        </a>

        <nav class="public-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Puntos Públicos</a>
          <a routerLink="/login" routerLinkActive="active">Iniciar Sesión</a>
        </nav>
      </header>

      <main class="public-main">
        <router-outlet />
      </main>
    </div>
  `,
})
export class PublicShellComponent {}
