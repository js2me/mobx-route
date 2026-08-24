// Enable MobX ↔ SolidJS reactivity bridge so that MobX observables
// are automatically tracked inside SolidJS createMemo / createRenderEffect.
import { enableObservableTracking } from 'mobx-solid';
enableObservableTracking();

export * from './components/index.js';
