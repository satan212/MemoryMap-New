import { Routes } from '@angular/router';
import { MemoriesListPage} from './pages/memories-list/memories-list';
import { MapPage } from './pages/map/map';
import { MemoryEntryPage } from './pages/memory-entry/memory-entry';
import { MemoryViewPage } from './pages/memory-view/memory-view';
import { Login } from './pages/login-page/login-page';
import { Register } from './pages/register/register';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // default route
  { path: 'map', component: MapPage },
  { path: 'login', component: Login },
  { path:'register',component:Register},
  { path: 'memories', component: MemoriesListPage }, // Fixed route name to match navigation calls
  { path: 'add-memory', component: MemoryEntryPage }, // Fixed route name to match navigation calls
  { path: 'view-memory/:id', component: MemoryViewPage }, // Fixed route to include parameter
  { path: '**', redirectTo: '/map' } // Wildcard route for handling unknown paths
];