/* eslint-disable @typescript-eslint/ban-ts-comment */
import { buildSearchString } from 'mobx-location-history';
import { observer } from 'mobx-react-lite';
import {
  Fragment,
  isValidElement,
  ReactElement,
  ReactNode,
  useEffect,
} from 'react';
import { flatMapDeep } from 'yummies/data';
import { AllPropertiesOptional, Maybe } from 'yummies/utils/types';

import {
  AnyRouteEntity,
  routeConfig,
  RouteNavigateParams,
  RouteParams,
} from '../../core/index.js';
import { isRouteEntity } from '../../core/utils/is-route-entity.js';

type SwitchBaseProps = {
  children: ReactNode;
};

type SwitchPropsWithDefaultRoute<TRoute extends AnyRouteEntity> = {
  default?: TRoute;
} & (AllPropertiesOptional<RouteParams<TRoute>> extends true
  ? {
      params?: Maybe<RouteParams<TRoute>>;
    }
  : {
      params: RouteParams<TRoute>;
    }) &
  SwitchBaseProps &
  RouteNavigateParams;

type SwitchPropsWithDefaultUrl = {
  default?: string;
} & SwitchBaseProps &
  RouteNavigateParams;

export type SwitchProps<TRoute extends AnyRouteEntity> =
  | SwitchPropsWithDefaultRoute<TRoute>
  | SwitchPropsWithDefaultUrl;

const flattenChildren = (children: ReactNode) =>
  flatMapDeep(children, (c): any =>
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    c && c.type === Fragment ? c.props.children : c,
  );

const isValidRouteElement = (
  element: any,
): element is ReactElement<
  { route: AnyRouteEntity },
  string | React.JSXElementConstructor<any>
> => {
  return (
    isValidElement(element) &&
    // @ts-ignore
    isRouteEntity(element.props?.route)
  );
};

export const Switch = observer(function <TRoute extends AnyRouteEntity>({
  children,
  default: defaultNavigation,
  // @ts-ignore
  params,
  ...navigateParams
}: SwitchProps<TRoute>) {
  let resultElement: ReactElement<any> | ReactNode = null;
  let defaultElement: ReactNode = null;

  for (const element of flattenChildren(children)) {
    if (isValidRouteElement(element) && element.props.route.isOpened) {
      resultElement = element;
      break;
    } else {
      defaultElement = element;
    }
  }

  const isResultElementFound = resultElement;

  useEffect(() => {
    if (!isResultElementFound && defaultNavigation) {
      if (typeof defaultNavigation === 'string') {
        const history = routeConfig.get().history;
        const url = `${defaultNavigation}${buildSearchString(navigateParams.query || {})}`;

        if (navigateParams.replace) {
          history.replace(url, navigateParams.state);
        } else {
          history.push(url, navigateParams.state);
        }
      } else if (!defaultNavigation.isOpened) {
        defaultNavigation.open(params, navigateParams);
      }
    }
  }, [isResultElementFound, defaultNavigation]);

  return resultElement ?? defaultElement;
});
