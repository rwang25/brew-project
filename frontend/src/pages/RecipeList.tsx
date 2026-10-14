import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import {
  useBrews,
  useDeleteRecipe,
  useIngredientPrices,
  useRecipeIngredients,
  useRecipeNutrientSchedule,
  useRecipes,
} from '@/api/hooks'
import type { BrewSummary, IngredientPrice, RecipeSummary } from '@/api/types'
import { Bottle, Carboy } from '@/components/Vessels'
import { ColourDot, HoneyWall, PageBody, Plank, ShelfPage } from '@/components/shelf'
import { Skeleton } from '@/components/ui/skeleton'
import { fullDate } from '@/lib/dates'
import { batchColour, pantryLook, priceFor } from '@/lib/pantry'
import { btnHoney, btnQuiet, eyebrowClass, h1Class, plankBottle } from '@/lib/shelfStyles'
import { IN_VESSEL, vesselFor } from '@/lib/status'
import { convertUnitCost } from '@/lib/units'
import { cn } from '@/lib/utils'

const MAX_CANDIDATES = 4

function candidateBatches(brews: BrewSummary[], recipes: RecipeSummary[]): BrewSummary[] {
  const recipeNames = new Set(recipes.map((r) => r.name.trim().toLowerCase()))
  const eligible = brews.filter(
    (b) => b.recipe_id == null && !recipeNames.has(b.name.trim().toLowerCase()) && b.status !== 'Discarded',
  )
  const finished = eligible
    .filter((b) => b.status === 'Bottled' || b.status === 'Completed')
    .sort((a, b) => (b.calculated_abv ?? 0) - (a.calculated_abv ?? 0))
  const working = eligible.filter((b) => IN_VESSEL.includes(b.status))
  return [...finished, ...working].slice(0, MAX_CANDIDATES)
}

function RecipeShelf({
  recipes,
  candidates,
  prices,
  selectedId,
  onSelect,
}: {
  recipes: RecipeSummary[]
  candidates: BrewSummary[]
  prices: IngredientPrice[] | undefined
  selectedId: number | null
  onSelect: (id: number) => void
}) {
  return (
    <div className="-mx-4 mt-7 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="relative w-max min-w-full">
        <Plank className={cn('top-[246px] h-3.5', plankBottle)} />
        <ul className="relative flex items-start">
          {recipes.map((recipe) => {
            const selected = recipe.id === selectedId
            return (
              <li key={recipe.id} className="w-[180px] shrink-0">
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(recipe.id)}
                  className="group relative flex w-full flex-col items-center rounded-lg text-ink"
                >
                  {selected && (
                    <span className="absolute left-[calc(50%+22px)] top-[72px] z-10 rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold tracking-[0.06em] text-honey">
                      RECIPE
                    </span>
                  )}
                  <span className="flex h-[246px] w-full items-end justify-center">
                    <Bottle
                      color={batchColour(recipe.ingredient_names, prices).color}
                      label={recipe.target_abv != null ? `${recipe.target_abv}%` : '—'}
                      sublabel="TARGET"
                      className="h-auto w-[70px] transition-transform duration-200 ease-out group-hover:-translate-y-1.5"
                    />
                  </span>
                  <span aria-hidden="true" className="h-3.5" />
                  <span className={cn('mt-4 px-2 text-center text-sm leading-tight', selected ? 'font-bold' : 'font-semibold')}>
                    {recipe.name}
                  </span>
                  <span className="mt-0.5 font-mono text-[11px] text-[#6E5A2A]">Saved {fullDate(recipe.created_at)}</span>
                </button>
              </li>
            )
          })}
          {recipes.length > 0 && candidates.length > 0 && (
            <li aria-hidden="true" className="mx-6 mt-10 h-[190px] w-0 border-l-2 border-dashed border-[#C9A25A]" />
          )}
          {candidates.map((brew) => {
            const color = batchColour(brew.ingredient_names, prices).color
            const working = vesselFor(brew.status) !== 'bottle'
            return (
              <li key={brew.id} className="w-[170px] shrink-0">
                <Link to={`/brews/${brew.id}`} className="group flex flex-col items-center rounded-lg text-ink">
                  <span className="flex h-[246px] w-full items-end justify-center">
                    {working ? (
                      <Carboy color={color} ghost className="h-[242px] w-[110px] transition-transform duration-200 ease-out group-hover:-translate-y-1.5" />
                    ) : (
                      <Bottle color={color} ghost className="h-auto w-[70px] transition-transform duration-200 ease-out group-hover:-translate-y-1.5" />
                    )}
                  </span>
                  <span aria-hidden="true" className="h-3.5" />
                  <span className="mt-4 px-2 text-center text-[13px] font-semibold leading-tight text-[#3A2E14]">{brew.name}</span>
                  <span className="mt-0.5 font-mono text-[11px] text-[#6E5A2A]">
                    {working
                      ? 'still fermenting'
                      : `${brew.calculated_abv != null ? `${brew.calculated_abv.toFixed(1)}% · ` : ''}save it`}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function RecipeDetail({ recipe, prices }: { recipe: RecipeSummary; prices: IngredientPrice[] | undefined }) {
  const { data: ingredients } = useRecipeIngredients(recipe.id)
  const { data: schedule } = useRecipeNutrientSchedule(recipe.id)
  const deleteRecipe = useDeleteRecipe()
  const [notesOpen, setNotesOpen] = useState(false)

  const colour = batchColour(recipe.ingredient_names, prices)
  const target = recipe.target_abv
  const doses = [...(schedule ?? [])].sort((a, b) => a.day_offset - b.day_offset)
  const notes = recipe.process_notes ?? ''
  const lowerNotes = notes.toLowerCase()
  const mentioned = [
    ['Fermaid-O', ['fermaid-o', 'fermaid o']],
    ['Fermaid-K', ['fermaid-k', 'fermaid k']],
    ['Go-Ferm', ['go-ferm', 'goferm', 'go ferm']],
    ['DAP', ['dap ']],
  ].find(([, spellings]) => (spellings as string[]).some((s) => lowerNotes.includes(s)))?.[0] as string | undefined

  const handleDelete = async () => {
    if (!confirm(`Delete the recipe "${recipe.name}"? Batches brewed from it stay.`)) return
    await deleteRecipe.mutateAsync(recipe.id)
    toast.success(`Deleted "${recipe.name}".`)
  }

  return (
    <article className="overflow-hidden rounded-[22px] border border-[#E7DFCF] bg-white">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-[#EFE8DA] px-7 py-6">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-[#8A5300]">Recipe · saved {fullDate(recipe.created_at)}</p>
          <h2 className="mt-1.5 font-display text-[clamp(28px,3vw,40px)] font-bold leading-[1.05] tracking-[-0.025em]">
            {recipe.name}
          </h2>
          <p className="mt-1 text-[15px] text-[#6E6150]">{recipe.style || recipe.brew_type}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link to={`/brews/new?recipe=${recipe.id}`} className={btnHoney}>
            <Plus className="size-[18px]" strokeWidth={2.2} />
            Brew this recipe
          </Link>
          <button type="button" onClick={handleDelete} disabled={deleteRecipe.isPending} className={cn(btnQuiet, 'min-h-12 text-destructive')}>
            Delete recipe
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] border-b border-[#EFE8DA]">
        {[
          ['Batch', recipe.batch_size != null ? `${recipe.batch_size} ${recipe.batch_size_unit ?? ''}`.trim() : '—', true],
          ['Yeast', recipe.yeast ?? '—', false],
          ['Target ABV', target != null ? `${target.toFixed(1)}%` : '—', true],
          ['OG for target', target != null ? (1 + target / 131.25).toFixed(3) : '—', true],
          ['Cost today', recipe.estimated_cost != null ? `$${recipe.estimated_cost.toFixed(2)}` : '—', true],
        ].map(([label, value, mono]) => (
          <div key={label as string} className="flex flex-col-reverse gap-0.5 px-7 py-4 shadow-[1px_0_0_#EFE8DA]">
            <dt className="text-xs uppercase tracking-[0.06em] text-[#6E6150]">{label}</dt>
            <dd className={mono ? 'font-mono text-lg font-medium' : 'text-base font-semibold'}>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-8 px-7 pb-7 pt-6">
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-7">
          <section>
            <h3 className="mb-2 font-display text-xl font-bold">Ingredients</h3>
            {ingredients && ingredients.length > 0 ? (
              <ul className="border-t border-[#EFE8DA]">
                {ingredients.map((ing) => {
                  const price = priceFor(ing.ingredient_name, prices)
                  const look = pantryLook(ing.ingredient_name, price)
                  const unitCost =
                    price && ing.unit ? convertUnitCost(price.unit_cost, price.unit, ing.unit) : null
                  const cost = unitCost != null && ing.amount != null ? unitCost * ing.amount : null
                  return (
                    <li key={ing.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#EFE8DA] py-3.5">
                      <ColourDot color={look.fill} />
                      <span className="min-w-0 flex-[1_1_200px]">
                        <span className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
                          {ing.ingredient_name}
                          {colour.decidedBy === ing.ingredient_name && (
                            <span className="rounded-full bg-honey-soft px-2 py-px text-[11px] font-bold text-[#6E4B00]">sets the colour</span>
                          )}
                        </span>
                        <span className="text-[13px] text-[#6E6150]">{[ing.category, ing.stage].filter(Boolean).join(' · ')}</span>
                      </span>
                      <span className="font-mono text-sm">{ing.amount != null ? `${ing.amount} ${ing.unit ?? ''}`.trim() : '—'}</span>
                      <span className="min-w-[64px] text-right font-mono text-[15px] font-semibold">{cost != null ? `$${cost.toFixed(2)}` : '—'}</span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-[#6E6150]">No ingredients saved with this recipe.</p>
            )}
            <p className="mt-2.5 text-[13px] text-[#6E6150]">
              Cost uses today's{' '}
              <Link to="/prices" className="font-semibold text-[#8A5300] hover:underline">
                price book
              </Link>
              , so it moves with honey prices.
            </p>
          </section>

          <section>
            <h3 className="font-display text-xl font-bold">Nutrient schedule</h3>
            {doses.length > 0 ? (
              <ul className="mt-2">
                {doses.map((d) => (
                  <li key={d.id} className="flex justify-between gap-4 border-b border-[#EFE8DA] py-2 text-[15px] last:border-b-0">
                    <span className="font-semibold">
                      {d.nutrient_type}
                      {d.amount != null && ` · ${d.amount} ${d.unit ?? ''}`.trimEnd()}
                    </span>
                    <span className="font-mono text-sm text-[#6E6150]">Day {d.day_offset}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3 rounded-[14px] border border-honey-line bg-[#FFF6DA] p-4">
                <p className="text-[15px] font-semibold">
                  {mentioned ? `None saved, but your notes mention ${mentioned}` : 'No schedule saved'}
                </p>
                <p className="text-sm text-[#5C4A1C]">
                  Add doses to a batch brewed from this recipe, then save that batch as a recipe to keep them.
                </p>
              </div>
            )}
          </section>
        </div>

        <section className="min-w-0 flex-[1_1_380px]">
          <h3 className="mb-2.5 font-display text-xl font-bold">Process notes</h3>
          {notes ? (
            <>
              <p className={cn('whitespace-pre-line text-[15px] leading-relaxed text-[#3A3020]', !notesOpen && 'line-clamp-9')}>
                {notes}
              </p>
              {notes.length > 500 && (
                <button type="button" onClick={() => setNotesOpen((o) => !o)} className={cn(btnQuiet, 'mt-3')}>
                  {notesOpen ? 'Show less' : 'Show full notes'}
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-[#6E6150]">No process notes saved.</p>
          )}
        </section>
      </div>
    </article>
  )
}

export function RecipeList() {
  const { data: recipes, isLoading } = useRecipes()
  const { data: brews } = useBrews()
  const { data: prices } = useIngredientPrices()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const list = recipes ?? []
  const selected = list.find((r) => r.id === selectedId) ?? list[0]
  const candidates = candidateBatches(brews ?? [], list)

  return (
    <ShelfPage>
      <HoneyWall className="pb-11">
        <p className={cn(eyebrowClass, 'mb-3')}>Recipes{recipes ? ` · ${list.length} saved` : ''}</p>
        <h1 className={h1Class}>Brew it again.</h1>
        <p className="mt-3.5 max-w-[560px] text-[17px] text-[#4A3A12]">
          A recipe fills in a new batch with its honey, yeast, vessel and target. Save one from any batch you'd
          make twice.
        </p>
        {isLoading ? (
          <Skeleton className="mt-7 h-[300px] w-full bg-honey-line" />
        ) : (
          <>
            {(list.length > 0 || candidates.length > 0) && (
              <RecipeShelf
                recipes={list}
                candidates={candidates}
                prices={prices}
                selectedId={selected?.id ?? null}
                onSelect={setSelectedId}
              />
            )}
            {candidates.length > 0 && (
              <p className="mt-[18px] text-[13px] text-[#6E4B00]">
                Dashed vessels are batches you could save. Open one and choose Save as recipe.
              </p>
            )}
          </>
        )}
      </HoneyWall>

      <PageBody>
        {selected ? (
          <RecipeDetail key={selected.id} recipe={selected} prices={prices} />
        ) : (
          !isLoading && (
            <div className="flex flex-col items-center gap-2.5 rounded-[20px] border-[1.5px] border-dashed border-[#D9CBAE] bg-white px-6 py-12 text-center">
              <p className="font-display text-xl font-bold">No recipes yet</p>
              <p className="max-w-md text-sm text-[#6E6150]">
                Open a batch you liked and choose Save as recipe. Its ingredients, yeast and notes come along.
              </p>
            </div>
          )
        )}
      </PageBody>
    </ShelfPage>
  )
}
