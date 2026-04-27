import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';

const publicRoutes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage) },
  { path: 'about', loadComponent: () => import('./pages/about/about.page').then((m) => m.AboutPage) },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.page').then((m) => m.ContactPage)
  },
  { path: 'faq', loadComponent: () => import('./pages/faq/faq.page').then((m) => m.FaqPage) },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/privacy/privacy.page').then((m) => m.PrivacyPage)
  },
  { path: 'terms', loadComponent: () => import('./pages/terms/terms.page').then((m) => m.TermsPage) },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage)
  },
  { path: 'login', loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage) },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password.page').then((m) => m.ResetPasswordPage)
  },
  { path: 'events', loadComponent: () => import('./pages/events/events.page').then((m) => m.EventsPage) },
  {
    path: 'events/:id',
    loadComponent: () =>
      import('./pages/event-details/event-details.page').then((m) => m.EventDetailsPage)
  }
];

const userProtectedRoutes: Routes = [
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.page').then((m) => m.CheckoutPage),
    canActivate: [authGuard]
  },
  {
    path: 'bookings/success',
    loadComponent: () =>
      import('./pages/bookings-success/bookings-success.page').then((m) => m.BookingsSuccessPage),
    canActivate: [authGuard]
  },
  {
    path: 'bookings/:id/confirmation',
    loadComponent: () =>
      import('./pages/booking-confirmation/booking-confirmation.page').then(
        (m) => m.BookingConfirmationPage
      ),
    canActivate: [authGuard]
  },
  {
    path: 'bookings',
    loadComponent: () => import('./pages/bookings/bookings.page').then((m) => m.BookingsPage),
    canActivate: [authGuard]
  },
  {
    path: 'bookings/:id',
    loadComponent: () =>
      import('./pages/booking-details/booking-details.page').then((m) => m.BookingDetailsPage),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
    canActivate: [authGuard]
  },
  {
    path: 'profile/orders',
    loadComponent: () =>
      import('./pages/profile-orders/profile-orders.page').then((m) => m.ProfileOrdersPage),
    canActivate: [authGuard]
  }
];

const adminProtectedRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
    canActivate: [adminGuard]
  },
  {
    path: 'dashboard/events',
    loadComponent: () =>
      import('./pages/dashboard-events/dashboard-events.page').then((m) => m.DashboardEventsPage),
    canActivate: [adminGuard]
  },
  {
    path: 'dashboard/bookings',
    loadComponent: () =>
      import('./pages/dashboard-bookings/dashboard-bookings.page').then(
        (m) => m.DashboardBookingsPage
      ),
    canActivate: [adminGuard]
  }
];

export const routes: Routes = [
  ...publicRoutes,
  ...userProtectedRoutes,
  ...adminProtectedRoutes,
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage)
  }
];
