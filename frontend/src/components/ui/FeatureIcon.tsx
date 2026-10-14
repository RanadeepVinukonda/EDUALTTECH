import AutoAwesome from "@mui/icons-material/AutoAwesome";
import SmartToy from "@mui/icons-material/SmartToy";
import Psychology from "@mui/icons-material/Psychology";
import AccountTree from "@mui/icons-material/AccountTree";
import FactCheck from "@mui/icons-material/FactCheck";
import Storage from "@mui/icons-material/Storage";
import Insights from "@mui/icons-material/Insights";
import Folder from "@mui/icons-material/Folder";
import Description from "@mui/icons-material/Description";
import Slideshow from "@mui/icons-material/Slideshow";
import Palette from "@mui/icons-material/Palette";
import SportsEsports from "@mui/icons-material/SportsEsports";
import AutoStories from "@mui/icons-material/AutoStories";
import DragIndicator from "@mui/icons-material/DragIndicator";
import Keyboard from "@mui/icons-material/Keyboard";
import Shield from "@mui/icons-material/Shield";
import Language from "@mui/icons-material/Language";
import Api from "@mui/icons-material/Api";
import GitHub from "@mui/icons-material/GitHub";
import CloudUpload from "@mui/icons-material/CloudUpload";
import Settings from "@mui/icons-material/Settings";
import EmojiEvents from "@mui/icons-material/EmojiEvents";
import Search from "@mui/icons-material/Search";
import Event from "@mui/icons-material/Event";
import Lightbulb from "@mui/icons-material/Lightbulb";
import Code from "@mui/icons-material/Code";
import Bolt from "@mui/icons-material/Bolt";
import TrendingUp from "@mui/icons-material/TrendingUp";
import TableChart from "@mui/icons-material/TableChart";
import Science from "@mui/icons-material/Science";
import Public from "@mui/icons-material/Public";
import type { SvgIconComponent } from "@mui/icons-material";

const RULES: Array<[RegExp, SvgIconComponent]> = [
  [/ai\b|\bml\b|machine learning|neural|llm|nlp|generative|copilot|computer vision|model|train|tuning|fine.?tun|prompt|classification|regression|prediction/i, SmartToy],
  [/logic|reasoning|thinking|problem solving/i, Psychology],
  [/algorithm|sorting|searching|pattern/i, AccountTree],
  [/test|evaluat/i, Science],
  [/interview|review|debug/i, FactCheck],
  [/database|sql|quer|storage|storing data|data types|dataset|pandas/i, Storage],
  [/tables?/i, TableChart],
  [/data science|analysis|statistic|visuali|charts?|insight|analytic/i, Insights],
  [/files?|folders?/i, Folder],
  [/document/i, Description],
  [/present/i, Slideshow],
  [/animation|design|styling|palette/i, Palette],
  [/game|interactiv/i, SportsEsports],
  [/stor(y|ies)|reading/i, AutoStories],
  [/drag|drop/i, DragIndicator],
  [/typing/i, Keyboard],
  [/safety|privacy|secur|threat|defen|cyber/i, Shield],
  [/internet|online|public/i, Public],
  [/web|html|css|dom|webpage|frontend|structur|layout/i, Language],
  [/api|rest|request|integration|backend|full.?stack/i, Api],
  [/github|git\b|version/i, GitHub],
  [/deploy|hosting|ship|scaling|cloud|docker/i, CloudUpload],
  [/automat|pipeline|\bbuild\b|\bci\b|config|setup/i, Settings],
  [/project|apps?|competition/i, EmojiEvents],
  [/search|research/i, Search],
  [/event/i, Event],
  [/use case|real example|real problem|what ai|everyday|idea/i, Lightbulb],
  [/function|variables?|conditions?|loops?|modules?|lists?|dictionar|code|coding|programming/i, Code],
  [/productivity|speed|faster|bolt|shipping/i, Bolt],
  [/trend|growth/i, TrendingUp],
];

const FALLBACK: SvgIconComponent[] = [AutoAwesome, Bolt, Lightbulb];

export default function FeatureIcon({
  feature,
  index = 0,
  className,
}: {
  feature?: string;
  index?: number;
  className?: string;
}) {
  const match = feature ? RULES.find(([re]) => re.test(feature)) : undefined;
  const Icon = match?.[1] ?? FALLBACK[index % FALLBACK.length];
  return <Icon fontSize="small" className={className} />;
}
