import { fireEvent, render, screen } from '@solidjs/testing-library';
import { createBrowserHistory } from 'mobx-location-history';
import { Link } from 'mobx-route/solid';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routeConfig } from '../../../../src/core/index.js';

describe('<Link />', () => {
  let history: ReturnType<typeof createBrowserHistory>;

  beforeEach(() => {
    history = createBrowserHistory();
    vi.spyOn(history, 'push').mockImplementation(() => {});
    vi.spyOn(history, 'replace').mockImplementation(() => {});
    routeConfig.update({
      history,
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('intercepts internal links and uses history push', () => {
    render(() => (
      <Link href="/app/profile" state={null}>
        Go local
      </Link>
    ));

    expect(fireEvent.click(screen.getByText('Go local'))).toBe(false);

    expect(history.push).toHaveBeenCalledWith('/app/profile', null);
  });

  it('should use history replace when replace=true', () => {
    render(() => (
      <Link href="/app/profile" replace state={null}>
        Go local
      </Link>
    ));

    expect(fireEvent.click(screen.getByText('Go local'))).toBe(false);

    expect(history.replace).toHaveBeenCalledWith('/app/profile', null);
    expect(history.push).not.toHaveBeenCalled();
  });

  it.each([
    'ctrlKey',
    'metaKey',
    'altKey',
    'shiftKey',
  ])('calls onClick without intercepting a click with %s', (key) => {
    const onClick = vi.fn();
    render(() => (
      <Link href="/app/profile" onClick={onClick}>
        Go local
      </Link>
    ));

    expect(fireEvent.click(screen.getByText('Go local'), { [key]: true })).toBe(
      true,
    );

    expect(onClick).toHaveBeenCalledOnce();
    expect(history.push).not.toHaveBeenCalled();
  });

  it.each([
    'https://example.com',
    'HTTPS://example.com',
    '//example.com',
    'mailto:hi@example.com',
    'tel:123',
  ])('keeps native navigation for %s', (href) => {
    render(() => <Link href={href}>External</Link>);

    expect(fireEvent.click(screen.getByText('External'))).toBe(true);

    expect(history.push).not.toHaveBeenCalled();
  });

  it.each([
    '_blank',
    '_parent',
    'preview',
  ])('calls onClick without intercepting target %s', (target) => {
    const onClick = vi.fn();
    render(() => (
      <Link href="/app/profile" target={target} onClick={onClick}>
        New tab
      </Link>
    ));

    expect(fireEvent.click(screen.getByText('New tab'))).toBe(true);

    expect(onClick).toHaveBeenCalledOnce();
    expect(history.push).not.toHaveBeenCalled();
  });

  it('intercepts links targeting the current context', () => {
    render(() => (
      <Link href="/app/profile" target="_SELF">
        Current tab
      </Link>
    ));

    expect(fireEvent.click(screen.getByText('Current tab'))).toBe(false);
    expect(history.push).toHaveBeenCalledWith('/app/profile', undefined);
  });

  it('preserves downloads with an empty download attribute', () => {
    render(() => (
      <Link href="/report.csv" download="">
        Download
      </Link>
    ));

    expect(fireEvent.click(screen.getByText('Download'))).toBe(true);
    expect(history.push).not.toHaveBeenCalled();
  });

  it('honors preventDefault from onClick', () => {
    render(() => (
      <Link href="/app/profile" onClick={(event) => event.preventDefault()}>
        Local
      </Link>
    ));

    expect(fireEvent.click(screen.getByText('Local'))).toBe(false);
    expect(history.push).not.toHaveBeenCalled();
  });

  it('forwards reactive props and the ref to a composed anchor', () => {
    const [title, setTitle] = createSignal('Initial');
    const ref = vi.fn();
    render(() => (
      <Link asChild href="/app/profile" title={title()} ref={ref}>
        {(anchorProps) => <a {...anchorProps}>Composed</a>}
      </Link>
    ));

    const anchor = screen.getByRole('link');
    expect(ref.mock.calls[0]?.[0]).toBe(anchor);
    expect(anchor.getAttribute('title')).toBe('Initial');
    setTitle('Updated');
    expect(anchor.getAttribute('title')).toBe('Updated');
    expect(fireEvent.click(anchor)).toBe(false);
    expect(history.push).toHaveBeenCalledWith('/app/profile', undefined);
  });
});
