import { ICONS, type IconName } from "@admin/lib/icons";

/** Same markup as the old `icon.x` strings: <svg viewBox="0 0 24 24" aria-hidden="true">…</svg>. */
export default function Icon({ name }: { name: IconName }) {
  return <Svg body={ICONS[name]} />;
}

/** Old `BTPanel.svgIcon(body)` — for one-off icons a page script built from a path string. `body` must be a static string. */
export function Svg({ body }: { body: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: body }} />;
}
