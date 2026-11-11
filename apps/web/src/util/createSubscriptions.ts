type EventFromHandler<H> =
  NonNullable<H> extends (this: any, event: infer E) => unknown ? E : never;

type EventMapFromOn<T extends EventTarget> = {
  [K in keyof T as K extends `on${infer Name}`
    ? Name
    : never]: EventFromHandler<T[K]>;
};

type Listeners<T extends EventTarget> = {
  [K in keyof EventMapFromOn<T>]?: (event: EventMapFromOn<T>[K]) => void;
};

export const createSubscriptions = <T extends EventTarget>(
  eventTarget: T,
  listeners: Listeners<T>,
) => {
  const entries = Object.entries(listeners) as [string, EventListener][];

  for (const [eventName, listener] of entries) {
    eventTarget.addEventListener(eventName, listener as EventListener);
  }

  return () => {
    for (const [eventName, listener] of entries) {
      eventTarget.removeEventListener(eventName, listener as EventListener);
    }
  };
};
