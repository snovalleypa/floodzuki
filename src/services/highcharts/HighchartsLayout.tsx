const BASE_HTML = `
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.00001, viewport-fit=cover" />
    <script src="https://code.highcharts.com/highcharts.js"></script>
    {{MODULE_SCRIPTS}}
    <style>
      body { margin: 0; padding: 0; overflow: hidden; }
      #container {
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        position: absolute;
        user-select: none;
        -webkit-user-select: none;
      }
      * {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
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
    </style>
    <script>
      // Default tooltip formatter for every chart in this WebView.
      // Reads precomputed HTML from point.options.tooltipHtml because Hermes
      // strips function bodies during RN -> WebView serialization (see
      // HighchartsReactNative.tsx). Defined here as static source so it is
      // never round-tripped through Function.prototype.toString().
      Highcharts.setOptions({
        tooltip: {
          useHTML: true,
          formatter: function () {
            return (this.point && this.point.options && this.point.options.tooltipHtml) || '';
          }
        }
      });

      function applyUpdate(data) {
        if (Highcharts.charts[0]) {
          Highcharts.charts[0].update(JSON.parse(data), true, true, true);
        }
      }
      document.addEventListener('message', function (e) { applyUpdate(e.data); });
      window.addEventListener('message', function (e) { applyUpdate(e.data); });
    </script>
  </head>
  <body>
    <div id="container"></div>
  </body>
</html>
`;

export const buildLayoutHtml = (modules: string[] = []): string => {
  const moduleScripts = modules
    .map((m) => `    <script src="https://code.highcharts.com/modules/${m}.js"></script>`)
    .join("\n");
  return BASE_HTML.replace("{{MODULE_SCRIPTS}}", moduleScripts);
};

export const LAYOUT_HTML = buildLayoutHtml();
