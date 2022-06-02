const { Telegraf } = require('telegraf')
const { sendReport } = require('./telegram/botBrain')

const bot = new Telegraf(process.env.BOT_TOKEN);

sendReport(bot)

