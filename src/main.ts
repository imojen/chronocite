import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

console.log('1. Starting application...');

const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)],
};

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    console.log('2. Application bootstrapped successfully');
  })
  .catch((err) => {
    console.error('Bootstrap error:', err);
    throw err;
  });
