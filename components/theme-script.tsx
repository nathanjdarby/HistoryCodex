import { THEME_STORAGE_KEY } from "@/lib/client/theme";

/** Runs before paint to avoid a flash of the wrong theme. */
export function ThemeScript() {
  const script = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);var dark=t!=="light";document.documentElement.classList.toggle("dark",dark);document.documentElement.dataset.theme=dark?"dark":"light";document.documentElement.style.colorScheme=dark?"dark":"light";}catch(e){document.documentElement.classList.add("dark");}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
