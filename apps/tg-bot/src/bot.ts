import "dotenv/config";
import { Telegraf } from "telegraf";
import type { Context } from "telegraf";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

import { ENV } from "./config/env.js";
import { mainKb } from "./ui/keyboards.js";
import { newSession, SessionState } from "./state/session.js";
import { QUEUES } from "@gad/queue-names";
import { handleStarsPayment } from "./billing/stars.js";
import { createCardsFlow } from "./flows/createCards.flow.js";
import { uploadTelegramPhoto } from "./lib/uploadTelegramPhoto.js";

import {
  billingHomeFlow,
  billingPlansFlow,
  billingTopupFlow
} from "./flows/billing.flow.js";

// ✅ публичный API
import { ensureUser } from "@gad/billing";

// --------------------
// Session (in-memory)
// --------------------
const sessions = new Map<number, SessionState>();

function getSession(userId: number) {
  if (!sessions.has(userId)) {
    sessions.set(userId, newSession());
  }
  return sessions.get(userId)!;
}

// --------------------
// Init bot / queue / redis
// --------------------
const bot = new Telegraf(ENV.token);

const queue = new Queue(QUEUES.MAIN, {
  connection: {
    host: ENV.redisHost,
    port: ENV.redisPort
  }
});

const redis = new Redis({
  host: ENV.redisHost,
  port: ENV.redisPort
});

// --------------------
// Start
// --------------------
bot.start(async (ctx: Context) => {
  const tgUserId = ctx.from!.id;

  console.log("[TG] /start", tgUserId);

  await ensureUser(tgUserId);

  const s = getSession(tgUserId);
  s.mode = undefined;
  s.uploadKeys = [];
  s.started = false;

  await ctx.reply(
    "Привет! Я бот для карточек WB / Ozon.\nВыбери режим:",
    { reply_markup: mainKb() }
  );
});

// --------------------
// Mode: Create cards
// --------------------
bot.action("MODE_CREATE", async (ctx: Context) => {
  const s = getSession(ctx.from!.id);
  s.mode = "CREATE";
  s.uploadKeys = [];
  s.started = false;

  console.log("[TG] MODE_CREATE", ctx.from!.id);

  await ctx.answerCbQuery();
  await ctx.reply(
    "Загрузи фото товара (2–10 фото).\nОбработка начнётся автоматически."
  );
});

// --------------------
// Upload photos (AUTO START)
// --------------------
bot.on("photo", async (ctx) => {
  const msg = ctx.message;
  if (!msg || !("photo" in msg)) return;

  const s = getSession(ctx.from!.id);
  if (s.mode !== "CREATE") return;

  // берём самое большое фото
  const photo = msg.photo[msg.photo.length - 1];

  // получаем file_path у Telegram
  const file = await ctx.telegram.getFile(photo.file_id);

  const fileKey = `uploads/${ctx.from!.id}/${Date.now()}.jpg`;

  // ✅ ВАЖНО: правильный вызов uploadTelegramPhoto
  const uploaded = await uploadTelegramPhoto({
    botToken: ENV.token,
    filePathOnTelegram: file.file_path!,
    key: fileKey
  });

  s.uploadKeys.push(uploaded.key);

  // 🚀 автозапуск при 2 фото
  if (s.uploadKeys.length >= 2 && !s.started) {
    s.started = true;

    const lockKey = `tg:ready:${ctx.from!.id}`;
    const locked = await redis.set(lockKey, "1", "EX", 300, "NX");

    if (!locked) {
      await ctx.reply("⏳ Обработка уже запущена. Пожалуйста, подожди.");
      return;
    }

    const statusMsg = await ctx.reply(
      "⏳ Обработка запущена. Собираю архив…"
    );

    await createCardsFlow(queue, {
      tgUserId: ctx.from!.id,
      images: s.uploadKeys.map((key) => ({ key })),
      marketplace: "WB",
      tgMessageId: statusMsg.message_id
    });
  }
});



// --------------------
// Billing buttons
// --------------------
bot.action("BILLING_HOME", billingHomeFlow);
bot.action("BILLING_PLANS", billingPlansFlow);
bot.action("BILLING_TOPUP", billingTopupFlow);

// --------------------
// Navigation
// --------------------
bot.action("BACK_HOME", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("Главное меню:", { reply_markup: mainKb() });
});

// --------------------
// Payments
// --------------------
bot.on("successful_payment", handleStarsPayment);

// --------------------
// Launch
// --------------------
bot.launch();
console.log("TG bot started.");
