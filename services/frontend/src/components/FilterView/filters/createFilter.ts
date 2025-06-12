import { produce } from 'immer'

import { ReactNode } from 'react'
import { setFilterOptions } from '@/redux/filters'
import { mapValues } from '@oodikone/shared/util'

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
  defaultOptions: Record<any, any>

  /**
   * Function used to filter the students.
   */
  filter: (students: Student, ctx: FilterContext) => boolean

  isActive: (opts: FilterContext['options']) => boolean

  /**
   * Redux selectors.
   * `selectOptions` and `isActive` will be overwriten.
   */
  selectors?: Record<string, (options: FilterContext['options'], args: any) => any>

  /**
   * By default `setOptions` and `reset` are assigned.
   * NOTE: `reset` will set the value to null, this may not be desired!
   */
  actions?: Record<string, (options: FilterContext['options'], payload: any) => void>

  /**
   * Precompute filter;
   * This value is used instead of running the filter again for the population.
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

type FilterFactory = {
  key: string
  actions: Record<
    string,
    <T>(payload: T) => (
      view: string,
      getContext: FilterViewContextState['getContextByKey']
    ) => {
      payload: T
      type: string
    }
  >
  selectors: Record<
    string,
    <T, R = any>(
      args?: T
    ) => {
      (opts: FilterContext['options']): R
      filter: string
    }
  >
  (args?: any): Filter
}

export type Filter = {
  args?: any

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

/**
 * Unlike the name suggests, this function returns a filter factory.
 */
export const createFilter = (options: FilterOptions): FilterFactory => {
  const opt_selectors = options.selectors ?? {}
  const opt_actions = options.actions ?? {}

  /**
   * Selectors are wrapped redux selectors that act on the filter's options.
   */
  const selectors = mapValues(
    {
      ...opt_selectors,
      selectOptions: (opts, _) => opts,
      isActive: options.isActive,
    },
    ([key, selector]) => {
      const gift = args => {
        const wrapper = (opts: FilterContext['options']) => selector(opts, args)
        wrapper.filter = options.key

        return wrapper
      }

      return [key, gift]
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
      setOptions: (_, value) => value,
      reset: (..._) => null,
      ...opt_actions,
    },
    ([key, action]) => {
      return [
        key,
        payload => (view: string, getContext: FilterViewContextState['getContextByKey']) => {
          const ctx = getContext(options.key)

          return setFilterOptions({
            view,
            filter: options.key,
            action: `${options.key}/${key}`,
            options: produce(ctx.options, (draft: FilterContext['options']) => action(draft, payload)),
          })
        },
      ]
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
  const factory = (args?: any): Filter => ({
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
