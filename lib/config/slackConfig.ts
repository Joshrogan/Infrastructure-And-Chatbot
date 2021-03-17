const config = require("dotenv").config().parsed;

for (const key in config) {
  process.env[key] = config[key];
}

export const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN as string;
export const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET as string;
export const SLACK_CHANNEL_NAME = process.env.SLACK_CHANNEL_NAME as string;
