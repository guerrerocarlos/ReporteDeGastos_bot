const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: { webhookReply: true },
});

bot.telegram.setWebhook(
  "https://giotimnpl5.execute-api.eu-west-3.amazonaws.com/dev/webhook"
);