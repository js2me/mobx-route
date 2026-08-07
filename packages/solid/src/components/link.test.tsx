import { render, screen, fireEvent } from '@solidjs/testing-library';
import { enableObservableTracking } from 'mobx-solid';
import { createBrowserHistory } from 'mobx-location-history';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Enable MobX ↔ SolidJS reactivity bridge
enableObservableTracking();
import { routeConfig } from '../../../../src/core/index.js';
import { Link } from './link.js';

describe('<Link />', () => {
  const history = createBrowserHistory();

  beforeEach(() => {
    history.push = vi.fn();
    history.replace = vi.fn();
    routeConfig.update({
      history,
    });
  });

  it('should intercept non-http links and use history push', () => {
    render(() => (
      <Link href="/app/profile" state={null}>
        Go local
      </Link>
    ));

    fireEvent.click(screen.getByText('Go local'));

    expect(history.push).toHaveBeenCalledWith('/app/profile', null);
  });

  it('should use history replace when replace=true', () => {
    render(() => (
      <Link href="/app/profile" replace state={null}>
        Go local
      </Link>
    ));

    fireEvent.click(screen.getByText('Go local'));

    expect(history.replace).toHaveBeenCalledWith('/app/profile', null);
    expect(history.push).not.toHaveBeenCalled();
  });

  it('should not intercept clicks with ctrl/meta/alt/shift keys', () => {
    render(() => (
      <Link href="/app/profile" state={null}>
        Go local
      </Link>
    ));

    fireEvent.click(screen.getByText('Go local'), { ctrlKey: true });

    expect(history.push).not.toHaveBeenCalled();
  });

  it('should not intercept external links', () => {
    render(() => (
      <Link href="https://example.com" state={null}>
        External
      </Link>
    ));

    fireEvent.click(screen.getByText('External'));

    expect(history.push).not.toHaveBeenCalled();
  });

  it('should not intercept links with target=_blank', () => {
    render(() => (
      <Link href="/app/profile" target="_blank" state={null}>
        New tab
      </Link>
    ));

    fireEvent.click(screen.getByText('New tab'));

    expect(history.push).not.toHaveBeenCalled();
  });
});
