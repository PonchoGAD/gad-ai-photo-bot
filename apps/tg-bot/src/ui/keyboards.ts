// apps/tg-bot/src/ui/keyboards.ts
import { Markup } from "telegraf";
import type { InlineKeyboardMarkup } from "@telegraf/types";

/**
 * Главная клавиатура
 */
export function mainKb(): InlineKeyboardMarkup {
  return Markup.inlineKeyboard([
    [Markup.button.callback("🖼 Создать карточки", "MODE_CREATE")],
    [Markup.button.callback("✨ Улучшить фото", "MODE_ENHANCE")],
    [Markup.button.callback("🎥 Видео", "MODE_VIDEO")],
    [Markup.button.callback("💳 Баланс и тариф", "BILLING_HOME")]
  ]).reply_markup;
}

/**
 * Экран billing
 */
export function billingKb(): InlineKeyboardMarkup {
  return Markup.inlineKeyboard([
    [Markup.button.callback("➕ Пополнить баланс", "BILLING_TOPUP")],
    [Markup.button.callback("⬆️ Обновить тариф", "BILLING_PLANS")],
    [Markup.button.callback("⬅️ Назад", "BACK_HOME")]
  ]).reply_markup;
}

/**
 * Тарифы
 */
export function plansKb(): InlineKeyboardMarkup {
  return Markup.inlineKeyboard([
    [Markup.button.callback("FREE — 50 credits", "PLAN_FREE")],
    [Markup.button.callback("STARTER — 200 credits", "PLAN_STARTER")],
    [Markup.button.callback("PRO — 500 credits", "PLAN_PRO")],
    [Markup.button.callback("STUDIO — 3000 credits", "PLAN_STUDIO")],
    [Markup.button.callback("⬅️ Назад", "BILLING_HOME")]
  ]).reply_markup;
}

/**
 * Пополнение
 */
export function topupKb(): InlineKeyboardMarkup {
  return Markup.inlineKeyboard([
    [Markup.button.callback("⭐ Пополнить Stars", "TOPUP_STARS")],
    [Markup.button.callback("⬅️ Назад", "BILLING_HOME")]
  ]).reply_markup;
}
