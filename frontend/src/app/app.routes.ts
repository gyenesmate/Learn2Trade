import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'home',
    loadComponent: () => import('./components/pages/home-page/home-page.component').then(m => m.HomePageComponent),
    canActivate: []
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/pages/profile-page/profile-page.component').then(m => m.ProfilePageComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'edit-profile',
    loadComponent: () => import('./components/pages/edit-profile-page/edit-profile-page.component').then(m => m.EditProfilePageComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./components/pages/login-page/login-page.component').then(m => m.LoginPageComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'banned',
    loadComponent: () => import('./components/pages/banned-page/banned-page.component').then(m => m.BannedPageComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/pages/register-page/register-page.component').then(m => m.RegisterPageComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'crypto/:id',
    loadComponent: () => import('./components/pages/crypto-detail-page/crypto-detail-page.component').then(m => m.CryptoDetailPageComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/crypto-currencies/new',
    loadComponent: () => import('./components/pages/crypto-currency-edit-page/crypto-currency-edit-page.component').then(m => m.CryptoCurrencyEditPageComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'admin/crypto-currencies/:id/edit',
    loadComponent: () => import('./components/pages/crypto-currency-edit-page/crypto-currency-edit-page.component').then(m => m.CryptoCurrencyEditPageComponent),
    canActivate: [AuthGuard, AdminGuard]
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
