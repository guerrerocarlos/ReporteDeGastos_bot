'use strict';
const { Telegraf } = require("telegraf");
const lambdaRequestHandler = require('lambda-request-handler')
const botBrain = require("./telegram/botBrain")

const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: { webhookReply: true },
});

console.log(botBrain)

botBrain.initBot(bot)

const handler = (evt, cb) => {
  console.log("🔥", JSON.stringify(evt, null, 2));
  return lambdaRequestHandler(bot.webhookCallback("/webhook"))(evt, {});
};

const sendReport = async () => {
  await botBrain.sendReport(bot)
}

module.exports = { handler, sendReport }

// https://giotimnpl5.execute-api.eu-west-3.amazonaws.com/dev/webhook

// handler({}, () => {})
