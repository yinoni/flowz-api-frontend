const production = false;
export const API_URL = production ? process.env.NEXT_PUBLIC_API_URL : process.env.NEXT_PUBLIC_API_URL_LOCAL;
export const WS_URL = production ? process.env.NEXT_PUBLIC_WS_URL : process.env.NEXT_PUBLIC_WS_URL_LOCAL;