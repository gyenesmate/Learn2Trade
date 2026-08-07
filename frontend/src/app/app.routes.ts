import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'home',
    loadComponent: () => import('./components/pages/home-page/home-page.component').then(m => m.HomePageComponent),
    canActivate: []
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/pages/profile-page/profile-page.component').then(m => m.ProfilePageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit-profile',
    loadComponent: () => import('./components/pages/edit-profile-page/edit-profile-page.component').then(m => m.EditProfilePageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./components/pages/login-page/login-page.component').then(m => m.LoginPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'banned',
    loadComponent: () => import('./components/pages/banned-page/banned-page.component').then(m => m.BannedPageComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/pages/register-page/register-page.component').then(m => m.RegisterPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'crypto/:id',
    loadComponent: () => import('./components/pages/crypto-detail-page/crypto-detail-page.component').then(m => m.CryptoDetailPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/crypto-currencies/new',
    loadComponent: () => import('./components/pages/crypto-currency-edit-page/crypto-currency-edit-page.component').then(m => m.CryptoCurrencyEditPageComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'admin/crypto-currencies/:id/edit',
    loadComponent: () => import('./components/pages/crypto-currency-edit-page/crypto-currency-edit-page.component').then(m => m.CryptoCurrencyEditPageComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'testing-ground',
    loadComponent: () => import('./components/pages/testing-ground/testing-ground.component').then(m => m.TestingGroundComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./components/pages/not-found-page/not-found-page.component').then(m => m.NotFoundPageComponent)
  }
];
