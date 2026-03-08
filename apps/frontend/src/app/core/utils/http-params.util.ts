import { HttpParams } from '@angular/common/http';

export function buildHttpParams(input?: Record<string, unknown>): HttpParams {
  let params = new HttpParams();

  if (!input) {
    return params;
  }

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    params = params.set(key, String(value));
  });

  return params;
}
