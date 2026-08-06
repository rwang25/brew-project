import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type {
  Brew,
  BrewCreateInput,
  BrewSummary,
  BrewUpdateInput,
  GravityReading,
  GravityReadingCreateInput,
  Ingredient,
  IngredientCreateInput,
  IngredientPrice,
  IngredientUpdateInput,
  Meta,
  NutrientAddition,
  NutrientAdditionCreateInput,
  Recipe,
  RecipeIngredient,
  RecipeNutrientAddition,
  RecipeSummary,
  Reminders,
} from './types'

export function useMeta() {
  return useQuery({ queryKey: ['meta'], queryFn: () => api.get<Meta>('/meta') })
}

export function useBrews() {
  return useQuery({ queryKey: ['brews'], queryFn: () => api.get<BrewSummary[]>('/brews') })
}

export function useBrew(id: number | undefined) {
  return useQuery({
    queryKey: ['brews', id],
    queryFn: () => api.get<Brew>(`/brews/${id}`),
    enabled: id !== undefined,
  })
}

export function useCreateBrew() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BrewCreateInput) => api.post<Brew>('/brews', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brews'] }),
  })
}

export function useUpdateBrew(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BrewUpdateInput) => api.put<Brew>(`/brews/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brews'] })
      queryClient.invalidateQueries({ queryKey: ['brews', id] })
    },
  })
}

export function useDeleteBrew() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/brews/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brews'] }),
  })
}

export function useIngredients(brewId: number | undefined) {
  return useQuery({
    queryKey: ['brews', brewId, 'ingredients'],
    queryFn: () => api.get<Ingredient[]>(`/brews/${brewId}/ingredients`),
    enabled: brewId !== undefined,
  })
}

export function useAddIngredient(brewId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: IngredientCreateInput) =>
      api.post<Ingredient>(`/brews/${brewId}/ingredients`, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['brews', brewId, 'ingredients'] }),
  })
}

export function useUpdateIngredient(brewId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: IngredientUpdateInput }) =>
      api.put<Ingredient>(`/ingredients/${id}`, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['brews', brewId, 'ingredients'] }),
  })
}

export function useDeleteIngredient(brewId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ingredientId: number) => api.delete<void>(`/ingredients/${ingredientId}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['brews', brewId, 'ingredients'] }),
  })
}

export function useGravityReadings(brewId: number | undefined) {
  return useQuery({
    queryKey: ['brews', brewId, 'gravity-readings'],
    queryFn: () => api.get<GravityReading[]>(`/brews/${brewId}/gravity-readings`),
    enabled: brewId !== undefined,
  })
}

export function useAddGravityReading(brewId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: GravityReadingCreateInput) =>
      api.post<GravityReading>(`/brews/${brewId}/gravity-readings`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brews', brewId, 'gravity-readings'] })
      queryClient.invalidateQueries({ queryKey: ['brews', brewId] })
      queryClient.invalidateQueries({ queryKey: ['brews'] })
    },
  })
}

export function useDeleteGravityReading(brewId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (readingId: number) => api.delete<void>(`/gravity-readings/${readingId}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['brews', brewId, 'gravity-readings'] }),
  })
}

export function useNutrientSchedule(brewId: number | undefined) {
  return useQuery({
    queryKey: ['brews', brewId, 'nutrient-schedule'],
    queryFn: () => api.get<NutrientAddition[]>(`/brews/${brewId}/nutrient-schedule`),
    enabled: brewId !== undefined,
  })
}

export function useAddNutrientAddition(brewId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NutrientAdditionCreateInput) =>
      api.post<NutrientAddition>(`/brews/${brewId}/nutrient-schedule`, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['brews', brewId, 'nutrient-schedule'] }),
  })
}

export function useGenerateTosnaSchedule(brewId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.post<NutrientAddition[]>(`/brews/${brewId}/nutrient-schedule/generate-tosna`, {}),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['brews', brewId, 'nutrient-schedule'] }),
  })
}

export function useToggleNutrientAddition(brewId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      api.patch<NutrientAddition>(`/nutrient-schedule/${id}`, {
        completed,
        completed_date: completed ? new Date().toISOString().slice(0, 10) : null,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['brews', brewId, 'nutrient-schedule'] }),
  })
}

export function useDeleteNutrientAddition(brewId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/nutrient-schedule/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['brews', brewId, 'nutrient-schedule'] }),
  })
}

export function useRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: () => api.get<RecipeSummary[]>('/recipes'),
  })
}

export function useRecipe(id: number | undefined) {
  return useQuery({
    queryKey: ['recipes', id],
    queryFn: () => api.get<Recipe>(`/recipes/${id}`),
    enabled: id !== undefined,
  })
}

export function useRecipeIngredients(recipeId: number | undefined) {
  return useQuery({
    queryKey: ['recipes', recipeId, 'ingredients'],
    queryFn: () => api.get<RecipeIngredient[]>(`/recipes/${recipeId}/ingredients`),
    enabled: recipeId !== undefined,
  })
}

export function useRecipeNutrientSchedule(recipeId: number | undefined) {
  return useQuery({
    queryKey: ['recipes', recipeId, 'nutrient-schedule'],
    queryFn: () =>
      api.get<RecipeNutrientAddition[]>(`/recipes/${recipeId}/nutrient-schedule`),
    enabled: recipeId !== undefined,
  })
}

export function useSaveAsRecipe(brewId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.post<Recipe>(`/brews/${brewId}/save-as-recipe`, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipes'] }),
  })
}

export function useCreateBrewFromRecipe(recipeId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (startDate: string) =>
      api.post<Brew>(`/recipes/${recipeId}/create-brew`, { start_date: startDate }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brews'] }),
  })
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/recipes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipes'] }),
  })
}

export function useReminders() {
  return useQuery({ queryKey: ['reminders'], queryFn: () => api.get<Reminders>('/reminders') })
}

export function useIngredientPrices() {
  return useQuery({
    queryKey: ['ingredient-prices'],
    queryFn: () => api.get<IngredientPrice[]>('/ingredient-prices'),
  })
}

export function useUpsertIngredientPrice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { ingredient_name: string; unit: string; unit_cost: number }) =>
      api.post<IngredientPrice>('/ingredient-prices', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ingredient-prices'] }),
  })
}

export function useDeleteIngredientPrice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/ingredient-prices/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ingredient-prices'] }),
  })
}
