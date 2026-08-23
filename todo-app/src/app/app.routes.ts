import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
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
    redirectTo: 'login',
  },
];
