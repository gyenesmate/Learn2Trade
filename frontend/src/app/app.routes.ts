import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { adminGuard } from '@core/guards/admin.guard';
import { BaseLayoutComponent } from '@core/layout/base-layout/base-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: BaseLayoutComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        canActivate: [authGuard],
      },
      {
        path: 'home',
        loadComponent: () =>
          import('@features/markets/markets.component').then((m) => m.MarketsComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('@features/portfolio/portfolio.component').then((m) => m.PortfolioComponent),
        canActivate: [authGuard],
      },
      {
        path: 'edit-profile',
        loadComponent: () =>
          import('@features/portfolio/edit-profile/edit-profile.component').then(
            (m) => m.EditProfileComponent
          ),
        canActivate: [authGuard],
      },
      {
        path: 'login',
        loadComponent: () =>
          import('@features/auth/login/login.component').then((m) => m.LoginComponent),
        canActivate: [authGuard],
      },
      {
        path: 'banned',
        loadComponent: () =>
          import('@features/auth/banned/banned.component').then((m) => m.BannedComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('@features/auth/register/register.component').then((m) => m.RegisterComponent),
        canActivate: [authGuard],
      },
      {
        path: 'crypto/:id',
        loadComponent: () =>
          import('@features/trading/trading.component').then((m) => m.TradingComponent),
        canActivate: [authGuard],
      },
      {
        path: 'admin/crypto-currencies/new',
        loadComponent: () =>
          import('@features/markets/components/crypto-currency-edit/crypto-currency-edit.component').then(
            (m) => m.CryptoCurrencyEditComponent
          ),
        canActivate: [authGuard, adminGuard],
      },
      {
        path: 'admin/crypto-currencies/:id/edit',
        loadComponent: () =>
          import('@features/markets/components/crypto-currency-edit/crypto-currency-edit.component').then(
            (m) => m.CryptoCurrencyEditComponent
          ),
        canActivate: [authGuard, adminGuard],
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
];
