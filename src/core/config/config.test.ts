import { describe } from 'node:test';
import { createMemoryHistory } from 'mobx-location-history';
import { afterEach, beforeEach, expect, it, type Mock, vi } from 'vitest';
import { routeConfig } from './config.js';

describe('routeConfig', () => {
  vi.mock('mobx-location-history', async () => {
    // Use vi.importActual to get the real, non-mocked functions
    const actual = await vi.importActual<
      typeof import('mobx-location-history')
    >('mobx-location-history');

    const origCreateBrowserHistory = actual.createBrowserHistory;
    const origCreateQueryParams = actual.createQueryParams;

    const createBrowserHistorySpy = vi.fn((...args: any) => {
      return origCreateBrowserHistory(...args);
    });
    const createQueryParamsSpy = vi.fn((...args: any) => {
      // @ts-expect-error
      return origCreateQueryParams(...args);
    });

    return {
      ...actual,
      createBrowserHistory: createBrowserHistorySpy,
      createQueryParams: createQueryParamsSpy,
    };
  });

  beforeEach(async () => {
    const { createBrowserHistory, createQueryParams } = await import(
      'mobx-location-history'
    );
    (createBrowserHistory as Mock).mockReset();
    (createQueryParams as Mock).mockReset();
  });

  afterEach(() => {
    routeConfig.unset();
  });

  it('should be defined', () => {
    expect(routeConfig.get()).toBeDefined();
  });

  it('should create browser history + query params one time', async () => {
    const { createBrowserHistory, createQueryParams } = await import(
      'mobx-location-history'
    );
    routeConfig.get();
    routeConfig.get();
    routeConfig.get();
    expect(createBrowserHistory).toBeCalledTimes(1);
    expect(createQueryParams).toBeCalledTimes(1);
  });

  it('should return the same instance', () => {
    const first = routeConfig.get();
    const second = routeConfig.get();
    expect(first).toBe(second);
  });

  it('should reset', () => {
    const first = routeConfig.get();
    routeConfig.unset();
    const second = routeConfig.get();
    expect(first).not.toBe(second);
  });

  it('should update', () => {
    const firstHistory = routeConfig.get().history;
    const superHistory = createMemoryHistory();
    Object.assign(superHistory, { superHistory: true });
    routeConfig.update({ history: superHistory });
    const secondHistory = routeConfig.get().history;
    expect(firstHistory).not.toBe(secondHistory);
  });
});
