/**
 * Returns an object of simple mutations for a state object, where
 * simple means that they will just replace an entry for any key.
 * For example, given a state object {key: value}, an object
 * {setKey: (state, payload) => state[key] = payload} will be returned.
 * This is useful to avoid writing basic operations.
 * @param {object} state state to generate mutations for
 * @returns {object.<string, function>} object of mutations
 */
export function generateSimpleMutations (state: GenericObject) {
    return Object.keys(state)
        .reduce((acc, key) => {
            return {
                ...acc,
                [key]: (moduleState: GenericObject, payload: any) => {
                    moduleState[key] = payload
                }
            }
        }, {})
}

function generateSimpleMutation (key) {
  return (moduleState: GenericObject, payload: any) => {
    moduleState[key] = payload
  }
}

function generateComplexMutation (key) {
  return (moduleState: GenericObject, payload: any) => {
    const p = key.split('/')
    let r = moduleState

    for (let i=0; i < p.length; i++) {
      if (i < p.length - 1) {
        r = r[p[i]]
      }
      else {
        r[p[i]] = payload
      }
    }
  }
}

export function generateMutations (state: GenericObject, prefix?: string) {
    const mutations = Object.keys(state)
        .reduce((acc, key) => {
            const _key = prefix ? prefix + '/' + key : key
            const mutation = prefix ? generateComplexMutation(_key) : generateSimpleMutation(_key)

            if (state[key]?.constructor !== Object) {
              return {
                ...acc,
                [_key]: mutation
              }
            }
            else {
              return {
                ...acc,
                [_key]: mutation,
                ...generateMutations(state[key], _key)
              }
            }
        }, {})

  console.log(mutations)

    return mutations
}

/**
 * Returns an object of simple getters for a state object, where
 * simple means that they will just return an entry for any key.
 * For example, given a state object {key: value}, an object
 * {key: state => state[key]} will be returned.
 * This is useful to avoid writing basic operations.
 * @param {object} state state to generate getters for
 * @returns {object.<string, function>} object of getters
 */
export function generateSimpleGetters (state: GenericObject) {
    return Object.keys(state)
        .reduce((acc, key) => ({
            ...acc,
            [key]: s => s[key]
        }), {})
}

export function generateStoreGetterSetter (properties: string[][]) {
  return properties.reduce((acc, keys) => {
    return {
      ...acc,
      [keys[0]]: {
        get () {
          return resolveStorePath(keys[1], this)
        },
        set (val) {
            // if key[2] is defined use this path as custom setter
            this.$store.commit(keys[2] || keys[1], val)
        }
      }
    }
  }, {});
}

export function resolveStorePath (path: string, ctx: Vue) {
  const pathArr = path.split("/")

  let stateVal = ctx.$store?.state

  pathArr.forEach(key => {
    if (stateVal) {
      stateVal = stateVal[key];
    }
  });

  // console.log(ctx.$store.state, stateVal);

  return stateVal
}

