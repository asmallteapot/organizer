import modelReducer from './model'
import Model from '../store/model'
import _ from 'lodash'
import Immutable from 'immutable'

function updateModel(data) {
    return {
        type: 'UPDATE_MODEL',
        id: data.id,
        data: data,
        name: 'test'
    }
}

it('should append models to an empty store', () => {
    const testModel = new Model('test')
    var testRows = []
    var state = undefined
    for(var i = 0; i < 10; i++) {
        const modelInstance = {id: i}
        testRows.push([i, modelInstance])
        state = modelReducer(state, updateModel(modelInstance))
    }
    expect(state).toEqual(Immutable.Map({
          models: {
              test: _.fromPairs(testRows)
          }
      }))
})

it('should update models and maintain order', () => {
    const testModel = new Model('test')
    const updatedRows = []
    var state = undefined
    for(var i = 0; i < 10; i++) {
        const modelInstance = {id: i}
        state = modelReducer(state, updateModel(modelInstance))
    }

    for(var i = 10; i >= 0; i--) {
        const modelInstance = {id: i, updated: i % 3}
        updatedRows.push([i, modelInstance])
        state = modelReducer(state, updateModel(modelInstance))
    }

    expect(state).toEqual(Immutable.Map({
        models: {
            test: _.fromPairs(updatedRows)
        }
    }))
})
