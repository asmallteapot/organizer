import { createSelector } from 'reselect'
import _ from 'lodash'
import distance from '@turf/distance'
import { bindActionCreators } from 'redux'

import { csrftoken } from '../Django'
import Queue from 'promise-queue'

export const REQUEST_MODELS = 'REQUEST_MODELS'
export const RECEIVE_MODELS = 'RECEIVE_MODELS'
export const UPDATE_MODEL = 'UPDATE_MODEL'
export const SAVING_MODEL = 'SAVING_MODEL'
export const SAVED_MODEL = 'SAVED_MODEL'

const fetchQueue = new Queue(2)

function queuedFetch() {
    const args = arguments
    return fetchQueue.add(() => {
        return fetch.apply(null, args)
    })
}

const getAllModels = state => state.model.models

const modelGetter = _.memoize((name) => {
    return createSelector(
        [getAllModels],
        models => {
            return _.get(models, name, [])
        }
    )
})

export class ModelSelector {

    constructor(slice) {
        this.slice = slice
        this[Symbol.iterator] = function* () {
            yield* this.slice
        }
    }

    all() {
        return this.filter(_.constant(true))
    }

    filter(filter = _.constant(true)) {
        return new ModelSelector(_.filter(this.slice, filter))
    }

    filterBy(key, value) {
        return this.filter(_.matchesProperty(key, value))
    }

    first() {
        return _.head(this.slice)
    }

    shouldFetch(id) {
        return this.filterBy('id', id).first() ? false : true
    }

    sortBy(key) {
        return new ModelSelector(_.sortBy(this.slice, _.property(key)))
    }

    withGeo() {
        return this.filter(m => m.geo && !_.isEmpty(m.geo))
    }

    nearby(currentLocation, radius = 0) {
        const modelsWithDistance = _.map(this.withGeo().slice, m => ({
            ...m,
            distance: distance(m.geo, currentLocation)
        }))
        const sorted = _.sortBy(modelsWithDistance, [m => m.distance])
        if (radius > 0) {
            return new ModelSelector(_.filter(sorted, m => m.distance <= radius))
        } else {
            return new ModelSelector(sorted)
        }
    }
}

export default class Model {
    constructor(name, options = {}) {
        this.name = name
        this.options = options
    }

    select(state) {
        return new ModelSelector(modelGetter(this.name)(state))
    }

    bindActionCreators(dispatch) {
        const funcNames = ['saving', 'saved', 'save', 'fetchOne', 'fetchIfNeeded', 'refresh', 'fetchAll', 'update', 'updateAndSave', 'request', 'receive']
        const funcPairs = _.map(funcNames, name => [name, _.bind(_.get(this, name), this)])
        const bindable = _.fromPairs(funcPairs)
        return bindActionCreators(bindable, dispatch)
    }

    saving(id) {
        return {
            type: SAVING_MODEL,
            id: Number(id)
        }
    }

    saved(id) {
        return {
            type: SAVED_MODEL,
            id: Number(id)
        }
    }

    save(id) {
        return (dispatch, getState) => {
            const selector = new Model(this.name).select(getState())
            const model = selector.filterBy('id', id).first()
            dispatch(this.saving(id))
            const data = {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(model)
            }
            
            console.groupCollapsed('PUT %s %s', this.name, id)
            console.log(data)
            console.groupEnd()
            return queuedFetch('/api/'+this.name+'/'+id+'/', data).then(() => {
                dispatch(this.saved(id))
                return Promise.resolve()
            })
        }
    }

    fetchIfNeeded(id) {
        return (dispatch, getState) => {
            if (this.select(getState()).shouldFetch(id)) {
                return dispatch(this.fetchOne(id))
            }
        }
    }

    fetchOne(id) {
        return dispatch => {
            dispatch(this.request())
            console.log('GET %s %s', this.name, id)
            return queuedFetch('/api/'+this.name+'/'+id+'/', {credentials: 'include'})
                .then(response => response.json())
                .then(json => {
                    if (!_.isEmpty(json))
                        return dispatch(this.receive([json]))
                })
        }
    }

    refresh() {
        return (dispatch, getState) => {
            if (this.select(getState()).all().slice.length == 0) {
                return dispatch(this.fetchAll())
            }
        }
    }

    fetchAll(params = {}) {
        return dispatch => {
            dispatch(this.request())
            const url = _.get(this.options, 'url', '/api/'+this.name+'/')
            const urlParams = new URLSearchParams(Object.entries(params))
            console.groupCollapsed('GET %s page=%s', this.name, _.get(params, 'page', 1))
            console.log(params)
            console.groupEnd()
            return queuedFetch(url+'?'+urlParams, {credentials: 'include'})
                .then(response => response.json())
                .then(json => {
                    if (json.next) {
                        const nextPage = (params.page || 1) + 1
                        const ret = dispatch(this.fetchAll({...params, page: nextPage}, this.options))
                        dispatch(this.receive(json.results))
                        return ret
                    } else {
                        return dispatch(this.receive(json.results))
                    }
                })
        }
    }

    update(id, dataOrCallback) {
        return (dispatch, getState) => {
            if (typeof dataOrCallback == 'function') {
                const foundItem = this.select(getState()).filterBy('id', id).first()
                return dispatch(this.update(id, dataOrCallback(foundItem)))
            } else {
                console.groupCollapsed('update %s %s', this.name, id)
                console.log(dataOrCallback)
                console.groupEnd()
                dispatch({
                    type: UPDATE_MODEL,
                    id: id,
                    data: dataOrCallback,
                    name: this.name
                })
                return Promise.resolve()
            }
        }
    }

    updateAndSave(id, dataOrCallback) {
        return dispatch => {
            dispatch(this.update(id, dataOrCallback))
                .then(() => dispatch(this.save(id)))
        }
    }

    request() {
        return {
            type: REQUEST_MODELS,
            name: this.name
        }
    }

    receive(results) {
        return {
            type: RECEIVE_MODELS,
            name: this.name,
            models: results || []
        }
    }
}
