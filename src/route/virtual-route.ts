import { FnValue, resolveFnValue } from 'yummies/common';
import { Maybe } from 'yummies/utils/types';

export class VirtualRoute {
  private isOpenedResolver?: Maybe<FnValue<boolean>>;

  constructor(isOpenedResolver?: FnValue<boolean>) {
    this.isOpenedResolver = isOpenedResolver;
  }

  get isOpened() {
    return (
      this.isOpenedResolver != null && resolveFnValue(this.isOpenedResolver)
    );
  }

  setResolver(isOpenedResolver: FnValue<boolean>) {
    this.isOpenedResolver = isOpenedResolver;
  }

  open() {
    this.isOpenedResolver = true;
  }

  close() {
    this.isOpenedResolver = false;
  }
}
