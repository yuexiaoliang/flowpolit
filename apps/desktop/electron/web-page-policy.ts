export const webPageProfile = {
  title: 'HedgeDoc',
  url: 'http://home.ts-ali.internal:3000/',
  partition: 'flowpilot-hedgedoc',
} as const;

const pageOrigin = new URL(webPageProfile.url).origin;

export function allowsPageNavigation(destination: string) {
  try {
    const url = new URL(destination);
    return !url.username && !url.password && url.origin === pageOrigin;
  } catch {
    return false;
  }
}

export function allowsPageRequest(destination: string) {
  try {
    const url = new URL(destination);
    if (url.username || url.password) return false;
    // HedgeDoc 的页面、上传和实时编辑连接只允许访问同一测试服务。
    if (url.protocol === 'ws:') url.protocol = 'http:';
    return url.origin === pageOrigin;
  } catch {
    return false;
  }
}
