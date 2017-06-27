import { DragSource } from 'react-dnd'
import React from 'react'
import Gravatar from 'react-gravatar'
import _ from 'lodash'
//import { Checkbox } from 'react-form'
import { Checkbox, CardHeader, Card, Badge, Avatar, ListItem } from 'material-ui'


class SignupCardBase extends React.Component {
  constructor(props) {
    super(props);
    this.state = {isOpen: false};
    this.setSignupState = this.setSignupState.bind(this);
  }

  setSignupState(state) {
    this.props.signup.state = state;
    this.props.signup.save();
  }

  componentWillUnmount() {
    this.props.signup.set({selected: false});
  }

  render() {
    const draggable = this.props.connectDragSource(
      <div>
        <ListItem
          primaryText={this.props.signup.activist.name}
          secondaryText={this.props.signup.activist.email}
          leftCheckbox={<Checkbox
                          checked={this.props.signup.selected}
                          onCheck={(evt, checked) => this.props.signup.set({selected: checked})} />}
          rightAvatar={<Avatar className={"rank-"+this.props.signup.activist.rank}>{this.props.signup.activist.rank}</Avatar>} />
      </div>
    )
    return (
      <div className="card-wrap">
        {draggable}
      </div>
    )
  }
}

const dragSpec = {
  beginDrag(props, monitor, component) {
    props.onDragging && props.onDragging(true);
    return {signup: props.signup}
  },
}

const collect = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  dragging: monitor.isDragging()
})

const SignupDragSource = DragSource("signup", dragSpec, collect);

const SignupCard = SignupDragSource(SignupCardBase);
export default SignupCard;