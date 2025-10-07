import { defineGhPagesDocConfig } from "sborshik/vitepress/define-gh-pages-doc-config";

import path from 'path';
import fs from 'fs';

const pckgJson = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../package.json'),
    { encoding: 'utf-8' },
  ),
);

export default defineGhPagesDocConfig(pckgJson, {
  createdYear:'2025',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Introduction', link: '/introduction/getting-started' },
      {
        text: `${pckgJson.version}`,
        items: [
          {
            items: [
              {
                text: `${pckgJson.version}`,
                link: `https://github.com/${pckgJson.author}/${pckgJson.name}/releases/tag/${pckgJson.version}`,
              },
            ],
          },
        ],
      },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting started', link: '/introduction/getting-started' },
        ],
      },
      {
        text: 'Core API',
        items: [
          { text: 'Route', link: '/core/Route' },
          { text: 'RouteGroup', link: '/core/RouteGroup' },
          { text: 'VirtualRoute', link: '/core/VirtualRoute' },
          { text: 'Router', link: '/core/Router' },
          { text: 'routeConfig', link: '/core/routeConfig' },
        ],
      },
      {
        text: 'React',
        items: [
          { text: 'Link', link: '/react/Link' },
          { text: 'RouteView', link: '/react/RouteView' },
          { text: 'RouteViewGroup', link: '/react/RouteViewGroup' },
          // { text: 'RouteGroupView', link: '/react/RouteGroupView' },
        ],
      },
      {
        text: 'mobx-view-model',
        items: [
          { text: 'RouteViewModel', link: '/view-model/RouteViewModel' },
        ],
      },
      {
        text: 'Recipes',
        items: [
          { text: 'Routing declarations', link: '/recipes/routing-declarations' },
          { text: 'Modal routes', link: '/recipes/modal-routes' },
          { text: 'Memory routing', link: '/recipes/memory-routing' },
          { text: 'Not Found routing', link: '/recipes/not-found-routing' },
          { text: 'Hash routing', link: '/recipes/hash-routing' },
          { text: 'Protected routes', link: '/recipes/protected-routes' },
          { text: 'Rest path params', link: '/recipes/rest-path-params' },
        ],
      }
    ],
  },
});
