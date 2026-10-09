import { Routes } from '@angular/router';
import { authChildGuard, authGuard } from '@core/guards/auth.guard';
import { adminGuard } from '@core/guards/admin.guard';
import { AuthLayoutComponent } from '@core/layout/auth-layout/auth-layout.component';
import { BaseLayoutComponent } from '@core/layout/base-layout/base-layout.component';
import { LandingLayoutComponent } from '@core/layout/landing-layout/landing-layout.component';
import { LectureLayoutComponent } from '@core/layout/lecture-layout/lecture-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@features/landing/landing.component').then((m) => m.LandingComponent),
      },
    ],
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('@features/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('@features/auth/register/register.component').then((m) => m.RegisterComponent),
      },
      {
        path: 'banned',
        loadComponent: () =>
          import('@features/auth/banned/banned.component').then((m) => m.BannedComponent),
      },
    ],
  },
  {
    path: 'app',
    component: BaseLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    children: [
      {
        path: 'markets',
        data: { guest: true },
        loadComponent: () =>
          import('@features/markets/markets.component').then((m) => m.MarketsComponent),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('@features/portfolio/portfolio.component').then((m) => m.PortfolioComponent),
      },
      {
        path: 'edit-profile',
        loadComponent: () =>
          import('@features/portfolio/edit-profile/edit-profile.component').then(
            (m) => m.EditProfileComponent
          ),
      },
      {
        path: 'crypto/:id',
        loadComponent: () =>
          import('@features/trading/trading.component').then((m) => m.TradingComponent),
      },
      {
        path: 'admin/crypto-currencies/new',
        loadComponent: () =>
          import('@features/markets/components/crypto-currency-edit/crypto-currency-edit.component').then(
            (m) => m.CryptoCurrencyEditComponent
          ),
        canActivate: [adminGuard],
      },
      {
        path: 'admin/crypto-currencies/:id/edit',
        loadComponent: () =>
          import('@features/markets/components/crypto-currency-edit/crypto-currency-edit.component').then(
            (m) => m.CryptoCurrencyEditComponent
          ),
        canActivate: [adminGuard],
      },
      {
        path: 'testing-ground',
        loadComponent: () =>
          import('@features/system/testing-ground/testing-ground.component').then(
            (m) => m.TestingGroundComponent
          ),
      },
      {
        path: '**',
        loadComponent: () =>
          import('@features/system/not-found/not-found.component').then((m) => m.NotFoundComponent),
      },
    ],
  },
  {
    path: 'learn',
    component: LectureLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@features/learn/learn-coming-soon.component').then(
            (m) => m.LearnComingSoonComponent
          ),
      },
    ],
  },
];
