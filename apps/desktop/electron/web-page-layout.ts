export interface ViewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const pageTop = 84;

export function webPageBounds(width: number, height: number): ViewBounds {
  return { x: 0, y: pageTop, width, height: Math.max(0, height - pageTop) };
}

export function clampPanelBounds(bounds: ViewBounds, width: number, height: number): ViewBounds {
  const panelWidth = Math.min(width, Math.max(1, Math.round(bounds.width)));
  const panelHeight = Math.min(height - pageTop, Math.max(1, Math.round(bounds.height)));
  return {
    x: Math.round(Math.max(0, Math.min(bounds.x, width - panelWidth))),
    y: Math.round(Math.max(pageTop, Math.min(bounds.y, height - panelHeight))),
    width: panelWidth,
    height: panelHeight,
  };
}
