import {RateLimiter} from "discord.js-rate-limiter";

export const voteLimiter = new RateLimiter(1, 5000);
export const readyLimiter = new RateLimiter(1, 5000);

export const acceptLimiter = new RateLimiter(1, 20000);
