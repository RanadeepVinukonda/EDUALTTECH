import AutoAwesome from "@mui/icons-material/AutoAwesome";
import Bolt from "@mui/icons-material/Bolt";
import Extension from "@mui/icons-material/Extension";
import RocketLaunch from "@mui/icons-material/RocketLaunch";
import Lightbulb from "@mui/icons-material/Lightbulb";
import Insights from "@mui/icons-material/Insights";
import type { SvgIconComponent } from "@mui/icons-material";

const ICONS: SvgIconComponent[] = [AutoAwesome, Bolt, Extension, RocketLaunch, Lightbulb, Insights];

/** Rotating feature icon so a feature list reads with varied glyphs, not one repeated tick. */
export default function FeatureIcon({ index, className }: { index: number; className?: string }) {
  const Icon = ICONS[index % ICONS.length];
  return <Icon fontSize="small" className={className} />;
}
