export interface CatalogExercise {
  id: string;
  name: string;
  targetMuscle: string;
  category: 'Chest' | 'Back' | 'Shoulders' | 'Legs' | 'Arms' | 'Core';
  equipment: 'Gym' | 'Home' | 'Bodyweight';
  icon: string;
}

export const VERIFIED_EXERCISE_CATALOG: CatalogExercise[] = [
  // ── CHEST (16 EXERCISES) ──
  { id: 'bench_press', name: 'Bench Press', category: 'Chest', targetMuscle: 'Chest (Pectoralis Major)', equipment: 'Gym', icon: 'dumbbell' },
  { id: 'push_up', name: 'Push-up', category: 'Chest', targetMuscle: 'Chest & Triceps', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'chest_dip', name: 'Chest Dip', category: 'Chest', targetMuscle: 'Lower Chest', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'incline_dumbbell_press', name: 'Dumbbell Incline One Arm Hammer Press', category: 'Chest', targetMuscle: 'Upper Chest', equipment: 'Gym', icon: 'dumbbell' },
  { id: 'palms_in_incline_press', name: 'Palms In Incline Bench Press', category: 'Chest', targetMuscle: 'Upper Chest', equipment: 'Gym', icon: 'dumbbell' },
  { id: 'decline_hammer_press', name: 'Dumbbell Decline One Arm Hammer Press', category: 'Chest', targetMuscle: 'Lower Chest', equipment: 'Gym', icon: 'dumbbell' },
  { id: 'diamond_press', name: 'Diamond Press', category: 'Chest', targetMuscle: 'Inner Chest & Triceps', equipment: 'Home', icon: 'zap' },
  { id: 'decline_pushup', name: 'Decline Push-Up', category: 'Chest', targetMuscle: 'Upper Pectorals', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'clap_push_up', name: 'Clap Push Up', category: 'Chest', targetMuscle: 'Explosive Chest', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'elevanted_push_up', name: 'Elevanted Push-Up', category: 'Chest', targetMuscle: 'Lower Pectorals', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'incline_pushup', name: 'Incline Push-up', category: 'Chest', targetMuscle: 'Lower Chest Stretch', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'close_grip_pushup', name: 'Close-grip Push-up', category: 'Chest', targetMuscle: 'Inner Chest', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'diamond_pushup', name: 'Diamond Push-up', category: 'Chest', targetMuscle: 'Triceps & Mid Chest', equipment: 'Bodyweight', icon: 'zap' },
  { id: 'cobra_pushup', name: 'Cobra Push-up', category: 'Chest', targetMuscle: 'Lower Chest & Spine', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'pike_pushup', name: 'Pike Push up ', category: 'Chest', targetMuscle: 'Upper Chest & Shoulders', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'kneeling_rotational_pushup', name: 'Kneeling Rotational Push-up', category: 'Chest', targetMuscle: 'Chest & Core Mobility', equipment: 'Bodyweight', icon: 'flame' },

  // ── BACK (13 EXERCISES) ──
  { id: 'deadlift', name: 'Deadlift', category: 'Back', targetMuscle: 'Posterior Chain (Conventional Barbell Deadlift)', equipment: 'Gym', icon: 'shield' },
  { id: 'pull_up', name: 'Pull-up', category: 'Back', targetMuscle: 'Latissimus Dorsi', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'wide_grip_pull_up', name: 'Wide Grip Pull-Up', category: 'Back', targetMuscle: 'Upper Lats', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'commando_pull_up', name: 'Commando Pull-up', category: 'Back', targetMuscle: 'Lats & Core', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'l_pull_up', name: 'L-Pull-up', category: 'Back', targetMuscle: 'Lats & Core Compression', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'dumbbell_one_arm_row', name: 'Dumbbell One Arm Bent-over Row', category: 'Back', targetMuscle: 'Mid Lats', equipment: 'Home', icon: 'dumbbell' },
  { id: 'one_arm_bent_over_row', name: 'One Arm Bent-over Row', category: 'Back', targetMuscle: 'Mid Back & Rhomboids', equipment: 'Gym', icon: 'activity' },
  { id: 'suspended_row', name: 'Suspended Row', category: 'Back', targetMuscle: 'Upper Back', equipment: 'Bodyweight', icon: 'activity' },
  { id: 'seated_row_towel', name: 'Seated Row with Towel', category: 'Back', targetMuscle: 'Mid Back & Lats', equipment: 'Bodyweight', icon: 'activity' },
  { id: 'superman_row_towel', name: 'Superman Row with Towel', category: 'Back', targetMuscle: 'Lower Back & Rhomboids', equipment: 'Bodyweight', icon: 'shield' },
  { id: 'sliding_pulldown', name: 'Sliding Floor Pulldown on Towel', category: 'Back', targetMuscle: 'Lats Stretch', equipment: 'Bodyweight', icon: 'target' },
  { id: 'pullover_assisted', name: 'Self Assisted Inverted Pullover', category: 'Back', targetMuscle: 'Lats Extension', equipment: 'Bodyweight', icon: 'target' },
  { id: 'pullup_bent_knee', name: 'Pull-up with Bent Knee between Chairs', category: 'Back', targetMuscle: 'Lats Home Workout', equipment: 'Bodyweight', icon: 'flame' },

  // ── SHOULDERS (8 EXERCISES) ──
  { id: 'seated_shoulder_press', name: 'Seated Shoulder Press', category: 'Shoulders', targetMuscle: 'Anterior & Side Deltoids', equipment: 'Home', icon: 'dumbbell' },
  { id: 'arnold_press', name: 'Arnold Press', category: 'Shoulders', targetMuscle: 'All Deltoid Heads', equipment: 'Home', icon: 'dumbbell' },
  { id: 'lateral_raise', name: 'Lateral Raise', category: 'Shoulders', targetMuscle: 'Lateral Deltoids', equipment: 'Home', icon: 'zap' },
  { id: 'front_raise', name: 'Front Raise', category: 'Shoulders', targetMuscle: 'Anterior Deltoids', equipment: 'Home', icon: 'zap' },
  { id: 'dumbbell_rear_delt_fly', name: 'Dumbbell Rear Delt Fly ', category: 'Shoulders', targetMuscle: 'Rear Deltoids', equipment: 'Home', icon: 'activity' },
  { id: 'clean_and_press', name: 'Dumbbell Clean and Press', category: 'Shoulders', targetMuscle: 'Total Shoulder Power', equipment: 'Gym', icon: 'shield' },
  { id: 'lateral_raise_towel', name: 'Lateral Raise with Towel', category: 'Shoulders', targetMuscle: 'Side Delts Isometric', equipment: 'Bodyweight', icon: 'zap' },
  { id: 'shoulder_tap_pushup', name: 'Shoulder Tap Push-up', category: 'Shoulders', targetMuscle: 'Front Deltoids & Core', equipment: 'Bodyweight', icon: 'flame' },

  // ── LEGS (20 EXERCISES) ──
  { id: 'squat', name: 'Squat', category: 'Legs', targetMuscle: 'Quadriceps & Glutes', equipment: 'Gym', icon: 'shield' },
  { id: 'goblet_squat', name: 'Goblet Squat', category: 'Legs', targetMuscle: 'Quadriceps Mass', equipment: 'Home', icon: 'shield' },
  { id: 'bulgarian_split_squat', name: 'Bulgarian Split Squat', category: 'Legs', targetMuscle: 'Quads & Glutes', equipment: 'Home', icon: 'flame' },
  { id: 'romanian_deadlift', name: 'Romanian Deadlift', category: 'Legs', targetMuscle: 'Hamstrings & Glutes', equipment: 'Gym', icon: 'target' },
  { id: 'stiff_leg_deadlift', name: 'Dumbbell Stiff Leg Deadlift', category: 'Legs', targetMuscle: 'Hamstrings Stretch', equipment: 'Home', icon: 'target' },
  { id: 'bodyweight_single_leg_deadlift', name: 'Bodyweight Single Leg Deadlift', category: 'Legs', targetMuscle: 'Hamstrings Balance', equipment: 'Bodyweight', icon: 'target' },
  { id: 'single_leg_squat_support', name: 'Single Leg Squat with Support', category: 'Legs', targetMuscle: 'Unilateral Quads', equipment: 'Bodyweight', icon: 'shield' },
  { id: 'single_leg_squat', name: 'Single Leg Squat ', category: 'Legs', targetMuscle: 'Pistol Squat Strength', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'sumo_squat', name: 'Sumo Squat', category: 'Legs', targetMuscle: 'Inner Thighs & Glutes', equipment: 'Home', icon: 'shield' },
  { id: 'jump_squat', name: 'Jump Squat ', category: 'Legs', targetMuscle: 'Explosive Leg Power', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'squat_thrust', name: 'Squat Thrust', category: 'Legs', targetMuscle: 'Full Leg Cardio', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'sissy_squat', name: 'Sissy Squat', category: 'Legs', targetMuscle: 'Quad Isolation', equipment: 'Bodyweight', icon: 'zap' },
  { id: 'split_squat', name: 'Split Squat ', category: 'Legs', targetMuscle: 'Quad & Hamstring Balance', equipment: 'Home', icon: 'shield' },
  { id: 'jumping_squat_db', name: 'Dumbbell Jumping Squat', category: 'Legs', targetMuscle: 'Weighted Explosive Quads', equipment: 'Home', icon: 'flame' },
  { id: 'seated_calf_raise', name: 'Seated Calf Raise', category: 'Legs', targetMuscle: 'Calves (Soleus)', equipment: 'Gym', icon: 'activity' },
  { id: 'standing_calf_raise', name: 'Standing Calf Raise', category: 'Legs', targetMuscle: 'Calves (Gastrocnemius)', equipment: 'Gym', icon: 'activity' },
  { id: 'walking_lunge', name: 'Walking Lunge', category: 'Legs', targetMuscle: 'Quads & Glutes Dynamic', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'reverse_lunge', name: 'Reverse Lunge ', category: 'Legs', targetMuscle: 'Glutes & Hamstrings', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'side_lunge_leg', name: 'Side Lunge', category: 'Legs', targetMuscle: 'Adductors & Quads', equipment: 'Bodyweight', icon: 'activity' },
  { id: 'walking_high_knees_lunge', name: 'Walking High Knees Lunge', category: 'Legs', targetMuscle: 'Hip Flexors & Quads', equipment: 'Bodyweight', icon: 'flame' },

  // ── ARMS (14 EXERCISES) ──
  { id: 'hammer_curl', name: 'Hammer Curl', category: 'Arms', targetMuscle: 'Brachioradialis & Forearms', equipment: 'Home', icon: 'dumbbell' },
  { id: 'cross_body_hammer_curl', name: 'Cross Body Hammer Curl', category: 'Arms', targetMuscle: 'Brachialis Peak', equipment: 'Home', icon: 'dumbbell' },
  { id: 'biceps_concentration_curl', name: 'Biceps Leg Concentration Curl', category: 'Arms', targetMuscle: 'Biceps Peak Isolation', equipment: 'Home', icon: 'dumbbell' },
  { id: 'two_legs_hammer_curl_towel', name: 'Two Legs Hammer Curl with Towel ', category: 'Arms', targetMuscle: 'Biceps & Forearms', equipment: 'Bodyweight', icon: 'dumbbell' },
  { id: 'lying_biceps_curl_towel', name: 'Lying Double Legs Biceps Curl with Towel', category: 'Arms', targetMuscle: 'Biceps Isolation', equipment: 'Bodyweight', icon: 'dumbbell' },
  { id: 'one_arm_wrist_curl', name: 'One arm Wrist Curl', category: 'Arms', targetMuscle: 'Forearm Flexors', equipment: 'Home', icon: 'activity' },
  { id: 'one_arm_reverse_wrist_curl', name: 'One arm Revers Wrist Curl', category: 'Arms', targetMuscle: 'Forearm Extensors', equipment: 'Home', icon: 'activity' },
  { id: 'two_legs_reverse_biceps_curl', name: 'Two Legs Reverse Biceps Curl with Towel ', category: 'Arms', targetMuscle: 'Brachialis & Forearms', equipment: 'Bodyweight', icon: 'activity' },
  { id: 'triceps_dip', name: 'Triceps Dip', category: 'Arms', targetMuscle: 'Triceps Mass', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'triceps_press', name: 'Triceps Press ', category: 'Arms', targetMuscle: 'Triceps Long Head', equipment: 'Home', icon: 'zap' },
  { id: 'floor_skull_crusher', name: 'Dumbbell Lying Floor Skull Crusher', category: 'Arms', targetMuscle: 'Triceps Stretch', equipment: 'Home', icon: 'zap' },
  { id: 'bench_dip_floor', name: 'Bench dip on floor', category: 'Arms', targetMuscle: 'Triceps & Shoulders', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'triceps_dips_floor', name: 'Triceps Dips Floor', category: 'Arms', targetMuscle: 'Triceps Burnout', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'inverted_chin_curl', name: 'Inverted Chin Curl with Bent Knee between Chairs', category: 'Arms', targetMuscle: 'Biceps Peak Bodyweight', equipment: 'Bodyweight', icon: 'flame' },

  // ── CORE (8 EXERCISES) ──
  { id: 'front_plank', name: 'Front Plank', category: 'Core', targetMuscle: 'Core Stability (Transverse Abdominis)', equipment: 'Bodyweight', icon: 'shield' },
  { id: 'elbow_dynamic_plank', name: 'Elbow Up and Down Dynamic Plank', category: 'Core', targetMuscle: 'Total Core & Shoulders', equipment: 'Bodyweight', icon: 'shield' },
  { id: 'russian_twist', name: 'Russian Twist', category: 'Core', targetMuscle: 'Obliques & Core Rotation', equipment: 'Bodyweight', icon: 'zap' },
  { id: 'crunch_floor', name: 'Crunch Floor', category: 'Core', targetMuscle: 'Upper Abs Compression', equipment: 'Bodyweight', icon: 'heart' },
  { id: 'hanging_leg_raise', name: 'Hanging Leg Raise', category: 'Core', targetMuscle: 'Lower Abs Compression', equipment: 'Bodyweight', icon: 'flame' },
  { id: 'front_plank_toe_tap', name: 'Front Plank Toe Tap ', category: 'Core', targetMuscle: 'Core & Hip Flexors', equipment: 'Bodyweight', icon: 'shield' },
  { id: 'front_plank_leg_lift', name: 'Front Plank with Leg Lift ', category: 'Core', targetMuscle: 'Core & Glutes', equipment: 'Bodyweight', icon: 'shield' },
  { id: 'bridge_mountain_climber', name: 'Bridge - Mountain Climber', category: 'Core', targetMuscle: 'Lower Abs & Glutes', equipment: 'Bodyweight', icon: 'flame' }
];
