import {
  filterAndSortHeroes,
  type HeroSort,
} from "./utils/heroRanking";

import { reorderArray } from "./utils/selectionUtils";

import {
  calculateHeroUsage,
  findBestHistoricalTeam,
  calculateWinRate,
} from "./utils/combatStats";

import { TYPE_GRADIENT } from "./utils/heroStyles";

import { useHeroPreferences } from "./hooks/useHeroPreferences";
import { useHeroSelection } from "./hooks/useHeroSelection";
import { useCombatAnalytics } from "./hooks/useCombatAnalytics";
import { useAuth } from "./hooks/useAuth";
import { useCombatHistory } from "./hooks/useCombatHistory";
import { useManualCombat } from "./hooks/useManualCombat";

import { useEffect, useState } from "react";
import {
  RotateCcw,
  Search,
  Swords,
  Target,
  X,
  History,
  Trophy,
  Plus,
  Trash2,
  BookOpen,
  ArrowLeftRight,
  Crown,
  Shield,
  Scale,
  Settings,
  Check,
  CheckSquare,
  Square,
} from "lucide-react";

import {
  HEROES,
  CLASSES,
  HeroClass,
  TYPE_TEXT,
  CLASS_TEXT,
  formatStat,
} from "./heroes";

import {
  coverageReport,
  recommendTeam,
} from "./counter";

import type { Combat } from "./storage";

import {
  loadHeroPreferences,
  saveHeroPreferences,
} from "./storage";

import "./App.css";
import HeroManager from "./components/HeroManager";
import ManualCombatModal from "./components/ManualCombatModal";
import HeroSlots from "./components/HeroSlots";
import HeroGridPicker from "./components/HeroGridPicker";
import LoginModal from "./components/LoginModal";

const MAX_PICKS = 5;
const APP_VERSION = "2.1.0";
