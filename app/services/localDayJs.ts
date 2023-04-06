/**
 * Add plugins to dayjs
 */

import dayjs from "dayjs"

var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone') // dependent on utc plugin
var duration = require('dayjs/plugin/duration')
var relativeTime = require('dayjs/plugin/relativeTime')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(duration)
dayjs.extend(relativeTime)

const localDayJs = dayjs

export default localDayJs
