import { IStateTreeNode, types } from "mobx-state-tree"

/**
 * If you include this in your model in an props() block just under your props,
 * it'll allow you to have isFetching, isError and errorMessage props.
 *
 * E.g.:
 *
 *  const UserModel = types.model("User")
 *    .props({
 *      name: types.string,
 *      age: types.number
 *    })
 *    .props(withDataFetchingProps)
 *    .actions(withDataFetchingActions)
 *
 *   const user = UserModel.create({ name: "Jamon", age: 40 })
 *
 *   user.setIsFetching(true)
 *   user.setError("error message")
 */
export const dataFetchingProps = {
  isFetching: types.optional(types.boolean, false),
  isError: types.optional(types.boolean, false),
  errorMessage: types.optional(types.string, ""),
}

export const withDataFetchingActions = <T extends IStateTreeNode>(mstInstance: T) => ({
  setIsFetching(loading: boolean) {
    mstInstance["isFetching"] = loading

    if (loading) {
      mstInstance["isError"] = false
      mstInstance["errorMessage"] = ""
    }
  },

  setError(error: string) {
    mstInstance["isFetching"] = false
    mstInstance["isError"] = true
    mstInstance["errorMessage"] = error ?? "Unknown error"
  },

  clearError() {
    mstInstance["isError"] = false
    mstInstance["errorMessage"] = ""
  },

  clearDataFetching() {
    mstInstance["isFetching"] = false
    mstInstance["isError"] = false
    mstInstance["errorMessage"] = ""
  }
})
