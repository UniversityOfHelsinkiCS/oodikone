import { produce } from 'immer'
import { mapValues } from 'lodash'

import { ReactNode } from 'react'
import { setFilterOptions } from '@/redux/filters'

import { Student } from '..'
import type { FilterContext, FilterViewContextState } from '../context'
import type { FilterTrayProps } from '../FilterTray'

/** TODO: Find acual types */
type FilterOptions = {
  /**
   * Non-user visible (unique) identifier for the filter.
   */
  key: string

  /**
   * User visible identifier. Defaults to the key value.
   */
  title?: string

  /**
   * User visible tooltip.
   */
  info?: string

  /**
   * Default options with which the filter is initialized.
   *
   * Fallback for `resolveFilterOptions` if values are not stored
   * and initial values are not set.
   */
  defaultOptions: object

  /**
   * Function used to filter the students.
   */
  filter: (students: Student, ctx: FilterContext) => boolean

  isActive: (opts: any, ctx?: FilterContext) => boolean

  /**
   * Redux selectors.
   * `selectOptions` and `isActive` will be overwriten.
   */
  // Based on defaultOptions
  selectors?: Record<string, (options: any, args?) => any>

  /**
   * `setOptions` and `reset` will be overwriten.
   */
  actions?: Record<string, (arg0, arg1, ctx) => void>

  /**
   * Precompute filter. Calculated once per studentlist???
   */
  precompute?: (ctx: FilterContext) => any

  /**
   * Used to determine sort order.
   */
  priority?: number

  /**
   * Filter tray render component.
   */
  render: (props: FilterTrayProps, ctx: FilterContext) => ReactNode
}

export type Filter<Args = any> = {
  args?: Args

  key: FilterOptions['key']
  title: NonNullable<FilterOptions['title'] | FilterOptions['key']>
  info: FilterOptions['info']

  defaultOptions: FilterOptions['defaultOptions']

  isActive: FilterOptions['isActive']

  filter: FilterOptions['filter']
  precompute: FilterOptions['precompute']

  render: FilterOptions['render']
  priority: number
}

export type FilterFactory<Args> = {
  key: Filter['key']
  actions: any
  selectors: any
  (args?: Args): Filter<Args>
}

/**
 * Unlike the name suggests, this function returns a filter factory.
 */
export const createFilter = <Args = any>(options: FilterOptions): FilterFactory<Args> => {
  const opt_selectors = options.selectors ?? {}
  const opt_actions = options.actions ?? {}

  /**
   * Selectors are wrapped redux selectors that act on the filter's options.
   */
  const selectors = mapValues(
    {
      ...opt_selectors,
      selectOptions: opts => opts,
      isActive: opts => options.isActive(opts),
    },
    (selector: NonNullable<FilterOptions['selectors']>[string]) => {
      if (selector.length === 1) {
        const wrapper = options => selector(options)
        wrapper.filter = options.key
        return wrapper
      }
      return (...args) => {
        const wrapper = options => selector(options, args)
        wrapper.filter = options.key
        return wrapper
      }
    }
  )

  /**
   * Actions are wrapped redux actions that act on the filter's options.
   *
   * Note that these actions cannot be dispatched using the vanilla redux
   * dispatch function. You need to use the dipatch function obtained form
   * the useFilterDispatch hook.
   */
  const actions = mapValues(
    {
      ...opt_actions,
      setOptions: (_options, value) => value,
      reset: () => null,
    },
    (action: NonNullable<FilterOptions['actions']>[string], name) =>
      payload =>
      (view: string, getContext: FilterViewContextState['getContextByKey']) => {
        const ctx = getContext(options.key)

        return setFilterOptions({
          view,
          filter: options.key,
          action: `${options.key}/${name}`,
          options: produce(ctx.options, (draft: FilterContext['options']) => action(draft, payload, ctx)),
        })
      }
  )

  /**
   * `filter`
   * Evaluated for each student in the population.
   * Returns true if the student passes the filter.
   *
   * Parameters:
   *   1. student     - The student being evaluated.
   *   2. options     - Current options of the filter.
   *   3. precomputed - Value returned by the precomputetion function of
   *                    this filter, if one was defined.
   *
   * ---
   *
   * `render`
   * The render function renders the UI for this filter displayed in the
   * filter tray.
   *
   * For the simplest use cases, a component property can be provided, for
   * which a simple default render funciton is genereated.
   *
   * Parameters:
   *   1. props - Props to be passed to the component.
   *      props.options - Current options of the filter.
   *      props.onOptionsChange - Callback used to update the options.
   *      props.wihtoutSelf - Function used to evaluate the current filter-set
   *        _without_ this filter.
   *   2. precomputed - The value passed from the precompute function.
   *
   * ---
   *
   * `precompute`
   * The precompute function is executes _once_ every time the student list
   * changes. It's return value is passed to the filter and render functions.
   *
   * This can be used to, for example, generate lookup-tables from the student
   * data for use in the filtering.
   *
   * `isActive`
   * Returns whether the filter is active or not, based on the current options.
   * The filter is evaluated over the student list only when this function returns true.
   * Activity of the filter is also reflected in the user interface.
   *
   * ---
   *
   * `priority`
   * Filters' priority determines the order in which filters are evaluated.
   *
   * In the normal case, this should not matter. But especially filters which
   * modify the student data (ikr - sounds bad), this is important.
   *
   * The filters with lower priority are executed first.
   *
   * @dogamak
   */
  const factory = (args?: Args): Filter<Args> => ({
    args,

    key: options.key,
    title: options.title ?? options.key,
    info: options.info,

    defaultOptions: options.defaultOptions,

    isActive: options.isActive,

    filter: options.filter,
    precompute: options.precompute,

    render: options.render,
    priority: options.priority ?? 0,
  })

  factory.key = options.key
  factory.actions = actions
  factory.selectors = selectors

  return factory
}
