import { buildSearchString } from 'mobx-location-history';
import { routeConfig } from '../config/config.js';
import type { RouteNavigateParams } from '../route/route.types.js';

export const buildUrl = (url: string, navigateParams: RouteNavigateParams) => {
  const query =
    (navigateParams.mergeQuery ?? routeConfig.get().mergeQuery)
      ? {
          ...routeConfig.get().queryParams.data,
          ...navigateParams.query,
        }
      : (navigateParams.query ?? {});

  const [path] = url.split('?');

  return `${path}${buildSearchString(query)}`;
};
