// Shared CSS for the data-point* classes emitted by chartTooltipHtml.ts.
// Consumed by HighchartsLayout.tsx (WebView shell on native) and injected into
// document.head by LocalHighchartsReact.tsx (on web) so both platforms render
// the tooltip from one source of truth.
export const TOOLTIP_CSS = `
.data-point {
  font-family: -apple-system, system-ui, sans-serif;
  font-size: 12px;
  line-height: 1.4;
}
.data-point-title {
  color: #606060;
}
.data-point-content {
  color: #1a1a1a;
  font-weight: 600;
}
`;

export const TOOLTIP_STYLE_ELEMENT_ID = "floodzuki-tooltip-styles";
