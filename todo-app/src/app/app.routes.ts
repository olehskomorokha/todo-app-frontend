import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./home/home').then(component => component.Home),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register/register').then(component => component.Register),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login').then(component => component.Login),
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
