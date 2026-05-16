/**
 * Sport configuration — metadata for all supported sports
 *
 * Defines icons, categories, and sport-specific form fields.
 * Used by SportSelectionScreen, SportDetailsScreen, and SportsProfilesScreen.
 */

export type SportCategory = 'endurance' | 'racquet' | 'team' | 'individual';

export interface SportFieldOption {
  label: string;
  value: string;
}

export interface SportField {
  key: string;
  label: string;
  type: 'chips' | 'text' | 'number';
  options?: SportFieldOption[];
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad';
}

export interface SportConfig {
  name: string;
  icon: string;
  category: SportCategory;
  /** Sport-specific fields (before the common fields) */
  fields: SportField[];
}

const SKILL_LEVELS: SportFieldOption[] = [
  { label: 'Beginner', value: 'Beginner' },
  { label: 'Intermediate', value: 'Intermediate' },
  { label: 'Advanced', value: 'Advanced' },
  { label: 'Expert', value: 'Expert' },
];

const PREFERRED_TIMES: SportFieldOption[] = [
  { label: 'Morning', value: 'Morning' },
  { label: 'Afternoon', value: 'Afternoon' },
  { label: 'Evening', value: 'Evening' },
];

const PACE_OPTIONS: SportFieldOption[] = [
  { label: 'Easy', value: 'Easy' },
  { label: 'Moderate', value: 'Moderate' },
  { label: 'Tempo', value: 'Tempo' },
  { label: 'Hard', value: 'Hard' },
];

const PLAY_STYLE_OPTIONS: SportFieldOption[] = [
  { label: 'Singles', value: 'Singles' },
  { label: 'Doubles', value: 'Doubles' },
  { label: 'Both', value: 'Both' },
];

const GAME_STYLE_OPTIONS: SportFieldOption[] = [
  { label: 'Casual', value: 'Casual' },
  { label: 'Competitive', value: 'Competitive' },
  { label: 'Both', value: 'Both' },
];

/** Common fields appended to every sport */
export const COMMON_FIELDS: SportField[] = [
  { key: 'skillLevel', label: 'Skill Level', type: 'chips', options: SKILL_LEVELS },
  { key: 'preferredTime', label: 'Preferred Time', type: 'chips', options: PREFERRED_TIMES },
];

export const SPORTS: SportConfig[] = [
  // ── Endurance ──────────────────────────────────────────
  {
    name: 'Running',
    icon: 'run-fast',
    category: 'endurance',
    fields: [
      { key: 'distance', label: 'Distance (km)', type: 'number', placeholder: 'e.g. 5', keyboardType: 'decimal-pad' },
      { key: 'pace', label: 'Pace', type: 'chips', options: PACE_OPTIONS },
    ],
  },
  {
    name: 'Swimming',
    icon: 'swim',
    category: 'endurance',
    fields: [
      { key: 'distance', label: 'Distance (m)', type: 'number', placeholder: 'e.g. 1000', keyboardType: 'decimal-pad' },
      { key: 'pace', label: 'Pace', type: 'chips', options: PACE_OPTIONS },
    ],
  },
  {
    name: 'Cycling',
    icon: 'bicycle',
    category: 'endurance',
    fields: [
      { key: 'distance', label: 'Distance (km)', type: 'number', placeholder: 'e.g. 20', keyboardType: 'decimal-pad' },
      { key: 'pace', label: 'Pace', type: 'chips', options: PACE_OPTIONS },
    ],
  },

  // ── Racquet Sports ─────────────────────────────────────
  {
    name: 'Table Tennis',
    icon: 'table-tennis',
    category: 'racquet',
    fields: [
      { key: 'playStyle', label: 'Play Style', type: 'chips', options: PLAY_STYLE_OPTIONS },
    ],
  },
  {
    name: 'Pickleball',
    icon: 'tennis',
    category: 'racquet',
    fields: [
      { key: 'playStyle', label: 'Play Style', type: 'chips', options: PLAY_STYLE_OPTIONS },
    ],
  },
  {
    name: 'Tennis',
    icon: 'tennis',
    category: 'racquet',
    fields: [
      { key: 'playStyle', label: 'Play Style', type: 'chips', options: PLAY_STYLE_OPTIONS },
    ],
  },
  {
    name: 'Badminton',
    icon: 'badminton',
    category: 'racquet',
    fields: [
      { key: 'playStyle', label: 'Play Style', type: 'chips', options: PLAY_STYLE_OPTIONS },
    ],
  },

  // ── Team Sports ────────────────────────────────────────
  {
    name: 'Basketball',
    icon: 'basketball',
    category: 'team',
    fields: [
      {
        key: 'position', label: 'Position', type: 'chips',
        options: [
          { label: 'Point Guard', value: 'Point Guard' },
          { label: 'Shooting Guard', value: 'Shooting Guard' },
          { label: 'Small Forward', value: 'Small Forward' },
          { label: 'Power Forward', value: 'Power Forward' },
          { label: 'Center', value: 'Center' },
          { label: 'Any', value: 'Any' },
        ],
      },
      { key: 'gameStyle', label: 'Game Style', type: 'chips', options: GAME_STYLE_OPTIONS },
    ],
  },
  {
    name: 'Football',
    icon: 'soccer',
    category: 'team',
    fields: [
      {
        key: 'position', label: 'Position', type: 'chips',
        options: [
          { label: 'Forward', value: 'Forward' },
          { label: 'Midfielder', value: 'Midfielder' },
          { label: 'Defender', value: 'Defender' },
          { label: 'Goalkeeper', value: 'Goalkeeper' },
          { label: 'Any', value: 'Any' },
        ],
      },
      { key: 'gameStyle', label: 'Game Style', type: 'chips', options: GAME_STYLE_OPTIONS },
    ],
  },
  {
    name: 'Cricket',
    icon: 'cricket',
    category: 'team',
    fields: [
      {
        key: 'role', label: 'Role', type: 'chips',
        options: [
          { label: 'Batsman', value: 'Batsman' },
          { label: 'Bowler', value: 'Bowler' },
          { label: 'All-rounder', value: 'All-rounder' },
          { label: 'Wicketkeeper', value: 'Wicketkeeper' },
        ],
      },
      { key: 'gameStyle', label: 'Game Style', type: 'chips', options: GAME_STYLE_OPTIONS },
    ],
  },

  // ── Individual / Outdoor ───────────────────────────────
  {
    name: 'Rock Climbing',
    icon: 'carabiner',
    category: 'individual',
    fields: [
      {
        key: 'climbingType', label: 'Climbing Type', type: 'chips',
        options: [
          { label: 'Bouldering', value: 'Bouldering' },
          { label: 'Sport', value: 'Sport Climbing' },
          { label: 'Trad', value: 'Trad' },
          { label: 'Top Rope', value: 'Top Rope' },
          { label: 'Any', value: 'Any' },
        ],
      },
      { key: 'grade', label: 'Grade', type: 'text', placeholder: 'e.g. V4 or 5.10a' },
    ],
  },
  {
    name: 'Hiking',
    icon: 'hiking',
    category: 'individual',
    fields: [
      {
        key: 'difficulty', label: 'Difficulty', type: 'chips',
        options: [
          { label: 'Easy', value: 'Easy' },
          { label: 'Moderate', value: 'Moderate' },
          { label: 'Difficult', value: 'Difficult' },
          { label: 'Extreme', value: 'Extreme' },
        ],
      },
      {
        key: 'distanceRange', label: 'Distance Range', type: 'chips',
        options: [
          { label: 'Short (<5km)', value: 'Short' },
          { label: 'Medium (5-15km)', value: 'Medium' },
          { label: 'Long (15km+)', value: 'Long' },
        ],
      },
    ],
  },
];

/** Look up a sport config by name */
export function getSportConfig(name: string): SportConfig | undefined {
  return SPORTS.find((s) => s.name === name);
}

/** Get all fields for a sport (sport-specific + common) */
export function getSportFields(name: string): SportField[] {
  const config = getSportConfig(name);
  if (!config) return [...COMMON_FIELDS];
  return [...config.fields, ...COMMON_FIELDS];
}
