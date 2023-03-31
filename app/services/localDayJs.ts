/**
 * Add plugins to dayjs
 */

import dayjs from "dayjs"

var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone') // dependent on utc plugin
var duration = require('dayjs/plugin/duration')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(duration)

const localDayJs = dayjs

export default localDayJs
