/* eslint-disable @typescript-eslint/ban-ts-comment */
import { observer } from 'mobx-react-lite';
import { Fragment, isValidElement, ReactElement, ReactNode } from 'react';
import { flatMapDeep } from 'yummies';

import { AnyRouteEntity } from '../../core/index.js';

export interface SwitchProps {
  children: ReactNode;
}

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
    element.props?.route &&
    // @ts-ignore
    'isOpened' in element.props.route
  );
};

export const Switch = observer(({ children }: SwitchProps) => {
  for (const element of flattenChildren(children)) {
    if (isValidRouteElement(element) && element.props.route.isOpened)
      return element;
  }

  return null;
});
