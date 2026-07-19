import { Routes } from '@angular/router';
import { CategoryViewComponent } from './features/category-view/category-view.component';
import { HomeComponent } from './features/home/home.component';
import { HistoryComponent } from './features/history/history.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'tasks/quick', component: CategoryViewComponent, data: { length: 'Quick' } },
  { path: 'tasks/small', component: CategoryViewComponent, data: { length: 'Small' } },
  { path: 'tasks/medium', component: CategoryViewComponent, data: { length: 'Medium' } },
  { path: 'tasks/long-term', component: CategoryViewComponent, data: { length: 'Long-Term' } },
  { path: 'history', component: HistoryComponent },
  { path: '**', redirectTo: 'home' }
];
