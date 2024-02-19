import React from 'react'
import produce from 'immer'
import * as _ from 'lodash-es'
import { setFilterOptions } from '../../../redux/filters'

export const createFilter = options => {
  const Component = options.component

  const selectorFuncs = {
    ...(options.selectors ?? {}),
    selectOptions: opts => opts,
    isActive: opts => options.isActive(opts),
  }

  const actionFuncs = {
    ...(options.actions ?? {}),
    setOptions: (_options, value) => value,
    reset: () => null,
  }

  /**
   * Selectors are wrapped redux selectors that act on the filter's options.
   */
  const selectors = _.mapValues(selectorFuncs, selector => {
    if (selector.length === 1) {
      const wrapper = options => selector(options)
      wrapper.filter = options.key
      return wrapper
    }
    return (...args) => {
      const wrapper = options => selector(options, ...args)
      wrapper.filter = options.key
      return wrapper
    }
  })

  /**
   * Actions are wrapped redux actions that act on the filter's options.
   *
   * Note that these actions cannot be dispatched using the vanilla redux
   * dispatch function. You need to use the dipatch function obtained form
   * the useFilterDispatch hook.
   */
  const actions = _.mapValues(actionFuncs, (action, name) => payload => (view, getContext) => {
    const ctx = getContext(options.key)

    return setFilterOptions({
      view,
      filter: options.key,
      action: `${options.key}/${name}`,
      options: produce(ctx.options, draft => action(draft, payload, ctx)),
    })
  })

  const factory = args => ({
    args,

    /**
     * Non-user-visible key for differentiating the filter.
     */
    key: options.key,

    /**
     * User-visible label for the filter.
     *
     * Defaults to the filter key.
     */
    title: options.title ?? options.key,

    /**
     * Information tooltip displayed on hover.
     */
    info: options.info,

    /**
     * Default options with which the filter is initialized.
     */
    defaultOptions: options.defaultOptions,

    /**
     * Returns whether the filter is active or not, based on the current options.
     *
     * The filter is evaluated over the student list only when this function
     * returns true. Activity of the filter is also reflected in the user
     * interface.
     */
    isActive: options.isActive,

    /**
     * Evaluated for each student in the population.
     * Returns true if the student passes the filter.
     *
     * Parameters:
     *   1. student     - The student being evaluated.
     *   2. options     - Current options of the filter.
     *   3. precomputed - Value returned by the precomputetion function of
     *                    this filter, if one was defined.
     */
    filter: options.filter,

    /**
     * The precompute function is executes _once_ every time the student list
     * changes. It's return value is passed to the filter and render functions.
     *
     * This can be used to, for example, generate lookup-tables from the student
     * data for use in the filtering.
     */
    precompute: options.precompute,

    /**
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
     */
    render: options.render ? options.render : props => <Component {...props} />,

    /**
     * Filters' priority determines the order in which filters are evaluated.
     *
     * In the normal case, this should not matter. But especially filters which
     * modify the student data (ikr - sounds bad), this is important.
     *
     * The filters with lower priority are executed first.
     */
    priority: options.priority ?? 0,

    actions,

    selectors,
  })

  factory.key = options.key
  factory.actions = actions
  factory.selectors = selectors

  return factory
}
