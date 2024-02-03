import {RateLimiter} from "discord.js-rate-limiter";

export const acceptLimiter = new RateLimiter(1, 20000);

export const scoreLimiter = new RateLimiter(1, 10000);

export const readyLimiter = new RateLimiter(3, 10000);
