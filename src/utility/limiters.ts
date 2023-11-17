import {RateLimiter} from "discord.js-rate-limiter";

export const voteLimiter = new RateLimiter(4, 5000);

export const acceptLimiter = new RateLimiter(1, 20000);

export const scoreLimiter = new RateLimiter(1, 10000);

export const readyLimiter = new RateLimiter(3, 10000);
