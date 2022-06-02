const { Telegraf } = require('telegraf')
const { initBot } = require('./telegram/botBrain')

const bot = new Telegraf(process.env.BOT_TOKEN);

initBot(bot)

bot.launch();
