import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'catalog/makes'
	},
	{
		path: 'catalog',
		children: [
			{
				path: 'makes',
				loadComponent: () => import('./catalog/makes/makes.page').then(m => m.MakesPage)
			},
			{
				path: 'models',
				loadComponent: () => import('./catalog/models/models.page').then(m => m.ModelsPage)
			},
			{
				path: 'generations',
				loadComponent: () => import('./catalog/generations/generations.page').then(m => m.GenerationsPage)
			},
			{
				path: 'variants',
				loadComponent: () => import('./catalog/variants/variants.page').then(m => m.VariantsPage)
			},
			{
				path: 'derivatives',
				loadComponent: () => import('./catalog/derivatives/derivatives.page').then(m => m.DerivativesPage)
			},
			{
				path: 'features',
				loadComponent: () => import('./catalog/features/features.page').then(m => m.FeaturesPage)
			},
			{
				path: 'variant-features',
				loadComponent: () => import('./catalog/variant-features/variant-features.page').then(m => m.VariantFeaturesPage)
			}
		]
	}
];
