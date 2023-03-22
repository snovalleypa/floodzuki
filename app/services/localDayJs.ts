/**
 * Add plugins to dayjs
 */

import dayjs from "dayjs"

var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone') // dependent on utc plugin

dayjs.extend(utc)
dayjs.extend(timezone)

const localDayJs = dayjs

export default localDayJs
