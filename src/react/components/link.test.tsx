import { fireEvent, render } from '@testing-library/react';
import { createBrowserHistory } from 'mobx-location-history';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { routeConfig } from '../../core/index.js';
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

  it('should intercept https links and use history push', () => {
    const screen = render(
      <Link href="https://example.com/test" state={null}>
        Go
      </Link>,
    );

    fireEvent.click(screen.getByText('Go'));

    expect(history.push).toHaveBeenCalledWith('https://example.com/test', null);
  });
});
