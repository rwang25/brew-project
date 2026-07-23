export interface Brew {
  id: number
  name: string
  brew_type: string
  style: string | null
  batch_size: number | null
  batch_size_unit: string | null
  start_date: string
  rack_date: string | null
  bottle_date: string | null
  expected_ready_date: string | null
  status: string
  original_gravity: number | null
  final_gravity: number | null
  target_abv: number | null
  calculated_abv: number | null
  yeast: string | null
  temperature: number | null
  temperature_unit: string | null
  vessel: string | null
  tasting_notes: string | null
  process_notes: string | null
  recipe_id: number | null
  created_at: string
  updated_at: string
}

export interface BrewSummary extends Brew {
  total_ingredient_cost: number | null
}

export interface BrewCreateInput {
  name: string
  brew_type: string
  style?: string | null
  batch_size?: number | null
  batch_size_unit?: string | null
  start_date: string
  status: string
  original_gravity?: number | null
  target_abv?: number | null
  yeast?: string | null
  temperature?: number | null
  temperature_unit?: string | null
  vessel?: string | null
  process_notes?: string | null
}

export type BrewUpdateInput = Omit<
  Brew,
  'id' | 'calculated_abv' | 'created_at' | 'updated_at' | 'recipe_id'
>

export interface Ingredient {
  id: number
  brew_id: number
  ingredient_name: string
  amount: number | null
  unit: string | null
  category: string | null
  stage: string | null
  addition_date: string | null
  unit_cost: number | null
  total_cost: number | null
  notes: string | null
}

export interface IngredientCreateInput {
  ingredient_name: string
  amount?: number | null
  unit?: string | null
  category?: string | null
  stage?: string | null
  addition_date?: string | null
  unit_cost?: number | null
  total_cost?: number | null
  notes?: string | null
}

export interface GravityReading {
  id: number
  brew_id: number
  reading_date: string
  specific_gravity: number
  temperature: number | null
  temperature_unit: string | null
  notes: string | null
}

export interface GravityReadingCreateInput {
  reading_date: string
  specific_gravity: number
  temperature?: number | null
  temperature_unit?: string | null
  notes?: string | null
}

export interface NutrientAddition {
  id: number
  brew_id: number
  day_offset: number
  nutrient_type: string
  amount: number | null
  unit: string | null
  completed: boolean
  completed_date: string | null
  notes: string | null
}

export interface NutrientAdditionCreateInput {
  day_offset: number
  nutrient_type: string
  amount?: number | null
  unit?: string | null
  notes?: string | null
}

export interface Recipe {
  id: number
  name: string
  brew_type: string
  style: string | null
  batch_size: number | null
  batch_size_unit: string | null
  yeast: string | null
  vessel: string | null
  temperature: number | null
  temperature_unit: string | null
  target_abv: number | null
  process_notes: string | null
  created_at: string
  updated_at: string
}

export interface RecipeIngredient {
  id: number
  recipe_id: number
  ingredient_name: string
  amount: number | null
  unit: string | null
  category: string | null
  stage: string | null
  notes: string | null
}

export interface RecipeNutrientAddition {
  id: number
  recipe_id: number
  day_offset: number
  nutrient_type: string
  amount: number | null
  unit: string | null
  notes: string | null
}

export interface NutrientReminder {
  brew_id: number
  brew_name: string
  nutrient_type: string
  scheduled_date: string
  status: 'overdue' | 'due_soon'
}

export interface ReadyReminder {
  brew_id: number
  brew_name: string
  expected_ready_date: string
  status: 'overdue' | 'due_soon'
}

export interface Reminders {
  nutrient_reminders: NutrientReminder[]
  ready_reminders: ReadyReminder[]
}

export interface IngredientPrice {
  id: number
  ingredient_name: string
  unit: string
  unit_cost: number
  updated_at: string
}

export interface Meta {
  brew_types: string[]
  status_options: string[]
  ingredient_categories: string[]
  ingredient_stages: string[]
  nutrient_types: string[]
  batch_size_units: string[]
  temperature_units: string[]
}
