/**
 * In development the Vite proxy rewrites /gfmapi/* to the Azure Functions host,
 * bypassing CORS restrictions. In production the absolute URL is used directly
 * (the Azure Function should have CORS configured for the deployed origin).
 */
export const API_BASE = import.meta.env.DEV
  ? '/gfmapi'
  : 'https://gfmapi-fpgth4e8aqa8auae.northeurope-01.azurewebsites.net';
