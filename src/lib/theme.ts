export const themes = ["system", "light", "dark"] as const;
export type Theme = (typeof themes)[number];
export const THEME_KEY = "blinker:theme";

/** Inline in <head>: the stored theme before the first paint, no flash. */
export const themeScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
