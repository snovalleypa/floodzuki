export const LAYOUT_HTML = `
<!-- Copied from https://github.com/highcharts/highcharts-react-native/blob/master/dist/highcharts-layout/index.html -->

<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.00001, viewport-fit=cover" />
		<style>
			#container {
				width:100%;
				height:100%;
				top:0;
				left:0;
				right:0;
				bottom:0;
				position:absolute;
				user-select: none;
				-webkit-user-select: none;
			}

			* {
				-webkit-touch-callout: none;
				-webkit-user-select: none; /* Disable selection/copy in UIWebView */
				-khtml-user-select: none;
				-moz-user-select: none;
				-ms-user-select: none;
				user-select: none;
			}
		</style>
		<script>
			const hcUtils = {
					// convert string to JSON, including functions.
					parseOptions: function (chartOptions) {
						const parseFunction = this.parseFunction;

						const options = JSON.parse(chartOptions, function (val, key) {
							if (typeof key === 'string' && key.indexOf('function') > -1) {
								return parseFunction(key);
							} else {
								return key;
							}
						});

						return options;
					},
					// convert funtion string to function
					parseFunction: function (fc) {
						const fcArgs = fc.match(/\((.*?)\)/)[1],
								fcbody = fc.split('{');

						return new Function(fcArgs, '{' + fcbody.slice(1).join('{'));
					}
			};

			// Communication between React app and webview. Receive chart options as string.
			document.addEventListener('message', function (data) {
				Highcharts.charts[0].update(
				hcUtils.parseOptions(data.data),
				true,
				true,
				true
				);
			});

			window.addEventListener('message', function (data) {
					Highcharts.charts[0].update(
					hcUtils.parseOptions(data.data),
					true,
					true,
					true
				);
			});
   	</script>
  </head>
  <body>
  	<div id="container">Loading...</div>
  </body>
</html>
`