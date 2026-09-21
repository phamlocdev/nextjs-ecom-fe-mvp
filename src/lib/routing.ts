const STATIC_DYNAMIC_SEGMENTS = new Set(['__fallback', '__template'])

export function resolveDynamicRouteSegment(
  paramValue: string | undefined,
  pathname: string,
  prefix: string,
): string {
  if (paramValue && !STATIC_DYNAMIC_SEGMENTS.has(paramValue)) {
    return paramValue
  }

  const normalizedPrefix = `${prefix}/`
  return pathname.startsWith(normalizedPrefix)
    ? decodeURIComponent(pathname.slice(normalizedPrefix.length).split('/')[0] ?? '')
    : ''
}
