/**
 * @param {String} fieldName name of the modules' field to merge
 * @param {GenericObject[]} modules modules to compose; later appearing modules override
 * @returns {GenericObject} composed entry for a field of the modules
 */
function composeField(fieldName: string, modules: GenericObject[]) {
  return modules
    .map((m: GenericObject) => m[fieldName])
    .reduce(
      (accumulator: object, field: object) => ({
        ...accumulator,
        ...field,
      }),
      {}
    );
}

/**
 * Composes a vuex module from a given array of modules.
 * @param {GenericObject[]} modules modules to compose; later appearing modules override
 * @returns {GenericObject} composed module
 */
export default function (modules: object[]) {
  return {
    namespaced: true,
    state: composeField("state", modules),
    getters: composeField("getters", modules),
    mutations: composeField("mutations", modules),
    actions: composeField("actions", modules),
  };
}
