import { ReactNode } from 'react'
import type { FormattedStudent as Student } from '@oodikone/shared/types/studentData'
import { mapValues } from '@oodikone/shared/util'

import type { FilterViewContextState } from '../context'

export type FilterOptions<T = any> = Record<string, T>
type Selector<Options extends FilterOptions, T, R> = (options: Options, args: T) => R
type Action<Option extends FilterOptions, T> = (options: Option, args: T) => Option

/**
 * Per filter context, used with-in FilterView.
 */
export type FilterContext<Options extends FilterOptions, Args = undefined, Precompute = undefined> = {
  precomputed: Precompute
  options: Options
  args: Args
}

export type FilterTrayProps<Options extends FilterOptions, Args = undefined, Precompute = undefined> = FilterContext<
  Options,
  Args,
  Precompute
> & {
  students: Student[]
  onOptionsChange: (options: Options) => void
}

type FilterSettings<Options extends FilterOptions, Args, Precompute, SelectorT, SelectorR, ActionT> = {
  /**
   * Non-user visible (unique) identifier for the filter.
   */
  key: string

  /**
   * User visible identifier. Defaults to the key value.
   */
  title: string

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
  defaultOptions: Options

  /**
   * Function used to filter the students.
   */
  filter: (student: Student, ctx: FilterContext<Options, Args, Precompute>) => boolean

  /**
   * (Optional) Function used to mutate the students.
   */
  mutate?: (student: Student, ctx: FilterContext<Options, Args, Precompute>) => Student

  /**
   * Precompute filter;
   * This value is used instead of running the filter again for the population.
   */
  precompute?: (
    ctx: Pick<FilterContext<Options, Args, null>, 'options' | 'args'> & { students: Student[] }
  ) => Precompute

  /**
   * Filter tray render component.
   */
  render: (props: FilterTrayProps<Options, Args, Precompute>) => ReactNode

  isActive: Selector<Options, SelectorT, SelectorR>

  /**
   * Redux selectors.
   * `selectOptions` and `isActive` will be overwriten.
   */
  selectors?: Record<string, Selector<Options, SelectorT, SelectorR>>

  /**
   * By default `setOptions` and `reset` are assigned.
   * NOTE: `reset` will set the value to null, this may not be desired!
   */
  actions?: Record<string, Action<Options, ActionT>>
}

const assignSelectors = <Options extends FilterOptions, T, R>(
  isActive: Selector<Options, T, R>,
  selectors: Record<string, Selector<Options, T, R>> | undefined
): Record<string, Selector<Options, T, R>> =>
  Object.assign(
    {
      selectOptions: (opts: Options) => opts,
      isActive,
    },
    selectors
  )

const assignActions = <Options extends FilterOptions, T>(
  defaultOptions: Options,
  actions: Record<string, Action<Options, T>> | undefined
): Record<string, Action<Options, T>> =>
  Object.assign(
    {
      setOptions: (_prevOpts: Options, opts: Options) => opts,
      reset: () => defaultOptions,
    },
    actions
  )

/**
 * Filter wrapper that allows ANY filter to be assigned.
 */
export type GenericFilter<Options extends FilterOptions = any, Args = any, Precompute = any> = Filter<
  Options,
  Args,
  Precompute
>

export type Filter<
  Options extends FilterOptions,
  Args,
  Precompute,
  SelectorT = any,
  SelectorR = any,
  ActionT = any,
> = Pick<
  FilterSettings<Options, Args, Precompute, SelectorT, SelectorR, ActionT>,
  'key' | 'title' | 'info' | 'defaultOptions' | 'filter' | 'mutate' | 'precompute' | 'render' | 'isActive'
> & { args?: Args }

/**
 * Unlike the name suggests, this function returns a filter factory.
 */
export const createFilter = <
  Options extends FilterOptions,
  Args,
  Precompute,
  SelectorT = any,
  SelectorR = any,
  ActionT = any,
>(
  options: FilterSettings<Options, Args, Precompute, SelectorT, SelectorR, ActionT>
): {
  (args?: Args): Filter<Options, Args, Precompute, SelectorT, SelectorR, ActionT>
  key: string
  actions: Record<
    string,
    (
      payload: ActionT
    ) => (
      getContext: FilterViewContextState<Options>['getContextByKey'],
      setFilterOptions: FilterViewContextState<Options>['setFilterOptions']
    ) => void
  >
  selectors: Record<
    string,
    (args: SelectorT) => (getContext: FilterViewContextState<Options>['getContextByKey']) => SelectorR
  >
} => {
  const opt_selectors = assignSelectors(options.isActive, options.selectors)
  const opt_actions = assignActions(options.defaultOptions, options.actions)

  /**
   * Selectors are wrapped redux selectors that act on the filter's options.
   */
  const selectors = mapValues(opt_selectors, ([key, selector]) => {
    const useSelector = (args: SelectorT) => (getContext: FilterViewContextState<Options>['getContextByKey']) => {
      const ctx = getContext(options.key)

      return selector(ctx.options, args)
    }

    return [key, useSelector]
  })

  /**
   * Actions are wrapped redux actions that act on the filter's options.
   *
   * Note that these actions cannot be dispatched using the vanilla redux
   * dispatch function. You need to use the dipatch function obtained form
   * the useFilterDispatch hook.
   */
  const actions = mapValues(opt_actions, ([key, action]) => {
    const useAction =
      (payload: ActionT) =>
      (
        getContext: FilterViewContextState<Options>['getContextByKey'],
        setFilterOptions: FilterViewContextState<Options>['setFilterOptions']
      ) => {
        const ctx = getContext(options.key)

        const res = action(structuredClone(ctx.options), payload)
        setFilterOptions(options.key, res)
      }

    return [key, useAction]
  })

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
   * `mutate`
   * Mutate students in-place before passing the data.
   * Parameters are the same as for `filter`.
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
   */
  return Object.assign(
    (args?: Args) => ({
      args,

      key: options.key,
      title: options.title,
      info: options.info,

      defaultOptions: options.defaultOptions,
      filter: options.filter,
      mutate: options.mutate,
      precompute: options.precompute,
      render: options.render,
      isActive: options.isActive,
    }),
    {
      key: options.key,
      actions,
      selectors,
    }
  )
}
