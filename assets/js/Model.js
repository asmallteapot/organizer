import React from 'react'
import Events from 'ampersand-events'
import AmpersandModel from 'ampersand-model'
import AmpersandRestCollection from 'ampersand-rest-collection'
import _ from 'lodash'

import { csrftoken } from './Django'

const DjangoConfig = () => {
  return {
    headers: {
      'X-CSRFToken': csrftoken
    }
  }
}

export const DjangoModel = AmpersandModel.extend({
  ajaxConfig: DjangoConfig,
  props: {
    id: 'number'
  },
  derived: {
    url: {
      deps: ['id'],
      fn() {
        return this.getId() ? (this.urlRoot + this.getId() + '/') : this.urlRoot;
      }
    }
  }
})

export const DjangoCollection = AmpersandRestCollection.extend({
  ajaxConfig: DjangoConfig,
  parse(response) {
    return response.results;
  }
})

export const Activist = DjangoModel.extend({
  urlRoot: '/api/activists/',
  props: {
    address: 'string',
    created: 'string',
    email: 'string',
    name: 'string',
    rank: 'number',
  }
});

export const Signup = DjangoModel.extend({
  urlRoot: '/api/signups/',
  props: {
    state: 'string',
    action: 'string',
  },
  toJSON() {
    return {...this.serialize(), ...{activist: this.activist.url}};
  },
  children: {
    activist: Activist
  }
});

export const SignupCollection = DjangoCollection.extend({
  url: '/api/signups/',
  model: Signup,
})

export const ActivistCollection = DjangoCollection.extend({
  url: '/api/activists/',
  model: Activist
})

export const Action = DjangoModel.extend({
  urlRoot: '/api/actions/',
  props: {
    name: 'string',
    date: 'string',
  },
  collections: {
    signups: SignupCollection,
    //forms: FormCollection,
    //fields: FieldCollection
  }
});

export const ActionCollection = DjangoCollection.extend({
  url: '/api/actions/',
  model: Action
})

export const Form = DjangoModel.extend({
  urlRoot: '/api/forms/',
  props: {
    active: 'boolean',
    description: 'string',
    next_state: 'string',
    title: 'string'
  },
  collections: {
    //fields: FieldCollection
  },
  children: {
    action: Action
  }
});

export const FormCollection = DjangoCollection.extend({
  url: '/api/forms/',
  model: Form
});

export function withState(Component) {
  return class StateBinding extends React.Component {
    constructor(props) {
      super(props);
      Events.createEmitter(this);
      this.onUpdate = _.debounce(this.onUpdate.bind(this), 100);
      this.state = {updateHash: 0};
      this.mounted = false;
    }

    componentDidMount() {
      this.mounted = true;
      this.rebindProps({}, this.props);
    }

    componentWillUnmount() {
      this.mounted = false;
      this.stopListening();
    }

    onUpdate() {
      if (this.mounted) {
        this.setState({updateHash: this.state.updateHash+1});
      }
    }

    rebindProps(oldProps, nextProps) {
      const nextStates    = _.filter(_.values(nextProps), p => p.isState);
      const currentStates = _.filter(_.values(oldProps), p => p.isState);
      const removedStates = _.difference(currentStates, nextStates);
      const addedStates   = _.difference(nextStates, currentStates);

      _.each(removedStates, this.stopListening);
      _.each(addedStates,   s => this.listenTo(s, 'change', this.onUpdate));
    }

    componentWillReceiveProps(nextProps) {
      this.rebindProps(this.props, nextProps);
    }

    render() {
      return <Component {...this.props} />
    }
  }
}