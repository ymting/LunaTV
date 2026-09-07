import { getThemeBootstrapScript } from './bootstrap-script';

export { getThemeEnabled } from './bootstrap-script';

export function ThemeBootstrap({ enabled }: { enabled: boolean }) {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript(enabled) }}
    />
  );
}
