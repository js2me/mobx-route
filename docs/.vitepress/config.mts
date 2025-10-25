import { defineDocsVitepressConfig } from "sborshik/vitepress";
import { ConfigsManager } from "sborshik/utils/configs-manager";

const configs = ConfigsManager.create("../")

export default defineDocsVitepressConfig(configs, {
  createdYear:'2025',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Introduction', link: '/introduction/getting-started' },
      {
        text: `${configs.package.version}`,
        items: [
          {
            items: [
              {
                text: `${configs.package.version}`,
                link: `https://github.com/${configs.package.author}/${configs.package.name}/releases/tag/${configs.package.version}`,
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
