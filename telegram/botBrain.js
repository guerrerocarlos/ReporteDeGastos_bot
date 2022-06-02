const S3 = require("./utils/s3");

let memory = {};
let BUCKET = process.env.BUCKET;
let PREFIX = process.env.PREFIX;

let s3 = {
  get: (key) => {
    return S3.get(BUCKET, PREFIX, key);
  },
  set: (key, val) => {
    memory[key] = val;
    return S3.put(BUCKET, PREFIX, key, val);
  },
  ls: async (key) => {
    let lsResults = await S3.ls(BUCKET, PREFIX, { Prefix: key });
    console.log("lsResults", lsResults);
    let items = lsResults.CommonPrefixes;
    if (lsResults.Contents.length > 0) {
      items = lsResults.Contents;
    }

    return items.map((content) => {
      return (content.Key || content.Prefix)
        .replace(`${PREFIX.toLowerCase()}${key}`, "")
        .replace("/", "");
    });
  },
};

async function messageHandler(ctx, message, type) {
  console.log("🐸");
  const d = new Date();

  console.log(":: type", type);
  console.log(":: message", message);

  let text;
  let date;
  let chatId;
  let originalMessage;

  text = message.text;
  date = message.date;
  chatId = message.chat.id;

  if (message.text === "/report") {
    return await sendReport(ctx, chatId, message.message_id);
  }
  if (message.text === "/start") {
    await ctx.telegram.sendMessage(
      chatId,
      `Envíame cualquier mensaje que tenga un "+" o un "-" al principio, seguido de un número y luego una descripción del gasto, y te llevaré la cuenta mensual de gastos.`
    );
    await ctx.telegram.sendMessage(
      chatId,
      `Al final de cada mes, te enviaré un reporte en formato .csv`
    );
    await ctx.telegram.sendMessage(
      chatId,
      `Si quieres que te envíe el reporte en cualquier momento, usa el comando /report`
    );
    await ctx.telegram.sendMessage(chatId, `Mensaje de ejemplo:`);
    return await ctx.telegram.sendMessage(chatId, `+8,5 panadería`);
  }

  let resultMessage;

  if (text[0] === "+" || text[0] === "-") {
    let value = parseFloat(text.split(" ")[0].replace(",", "."));
    let description = text.split(" ");
    description.shift();
    message.description = description.join(" ");
    message.value = value;

    let balance =
      (await s3.get(`balance/${chatId}/${d.getYear()}/${d.getMonth()}`)) || 0;

    console.log("🤑 BALANCE:", balance);
    balance += value;
    console.log("💸 BALANCE:", balance);

    if (type === "edited_message") {
      originalMessage = await s3.get(
        `message/${chatId}/message/${message.message_id}`
      );
      console.log("originalMessage", originalMessage);

      balance -= originalMessage.value;

      resultMessage = await s3.get(
        `resultMessage/${chatId}/message/${message.message_id}`
      );
      await ctx.telegram.editMessageText(
        message.chat.id,
        resultMessage.message_id,
        undefined,
        "🧮"
      );
    } else {
      resultMessage = await ctx.telegram.sendMessage(chatId, "🧮", {
        reply_to_message_id: message.message_id,
      });

      await s3.set(
        `resultMessage/${chatId}/message/${message.message_id}`,
        resultMessage
      );
      await s3.set(
        `resultMessage/${chatId}/resultMessage/${resultMessage.message_id}`,
        resultMessage
      );
    }

    await s3.set(`message/${chatId}/message/${message.message_id}`, message);
    await s3.set(
      `message/${chatId}/${d.getYear()}/${d.getMonth()}/date/${message.date}`,
      message
    );
    await s3.set(`balance/${chatId}/${d.getYear()}/${d.getMonth()}`, balance);

    // setTimeout(() => {
    await ctx.telegram.editMessageText(
      message.chat.id,
      resultMessage.message_id,
      undefined,
      "= " + balance.toFixed(2)
    );
  }
}

function initBot(bot) {
  bot.on("message", (ctx) => messageHandler(ctx, ctx.message, "message"));
  bot.on("edited_message", (ctx) =>
    messageHandler(ctx, ctx.update.edited_message, "edited_message")
  );

  // Enable graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
  console.log("LISTENING :)");
}

async function sendReport(bot, chatId, messageId) {
  const t = new Date();
  const d = new Date();
  d.setDate(d.getDate() - 1);
  let chatIds = [chatId];
  if (!chatId) {
    chatIds = await s3.ls(`message/`);
  }
  console.log("chatIds", chatIds);
  await Promise.all(
    chatIds.map(async (chatId) => {
      let events = await s3.ls(
        `message/${chatId}/${d.getYear()}/${d.getMonth()}/date/`
      );
      console.log("events", events);
      let records = await Promise.all(
        events.map(async (event) => {
          return await s3.get(
            `message/${chatId}/${d.getYear()}/${d.getMonth()}/date/${event}`
          );
        })
      );
      console.log(records);
      let csv = records.map((record) => {
        return `${new Date(record.date * 1000).toISOString().split("T")[0]},${
          record.value
        },${record.description}`;
      });

      csv = csv.join("\n");
      console.log(csv);
      console.log(bot);

      if (csv.length === 0) {
        return await bot.telegram.sendMessage(
          chatId,
          `No hay gastos que reportar.`
        );
      }

      await bot.telegram.sendDocument(
        chatId,
        {
          source: new Buffer.from(csv),
          filename: `ReporteDeGastos_${
            1900 + t.getYear()
          }_${t.getMonth()}_${t.getDate()}.csv`,
        },
        {
          reply_to_message_id: messageId,
        }
      );
    })
  );
}

module.exports = {
  initBot,
  sendReport,
};
