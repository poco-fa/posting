// Wake Lock API TypeScript definitions
// https://w3c.github.io/screen-wake-lock/

interface WakeLockSentinel extends EventTarget {
  readonly released: boolean;
  readonly type: WakeLockType;
  release(): Promise<void>;
  addEventListener(type: 'release', listener: (event: Event) => void): void;
}

type WakeLockType = 'screen';

interface WakeLock {
  request(type: WakeLockType): Promise<WakeLockSentinel>;
}

interface Navigator {
  readonly wakeLock?: WakeLock;
}