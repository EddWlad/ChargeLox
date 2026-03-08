import { effect, WritableSignal } from '@angular/core';

export function enableAutoDismiss(
  messages: WritableSignal<string>[],
  durationMs = 4500,
): void {
  messages.forEach((message) => {
    effect((onCleanup) => {
      const value = message();
      if (!value) {
        return;
      }

      const timeout = setTimeout(() => {
        message.set('');
      }, durationMs);

      onCleanup(() => clearTimeout(timeout));
    });
  });
}
