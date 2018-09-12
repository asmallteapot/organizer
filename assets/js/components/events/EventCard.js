import React from 'react'
import Button from '@material-ui/core/Button'
import Avatar from '@material-ui/core/Avatar'
import Badge from '@material-ui/core/Badge'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardActions from '@material-ui/core/CardActions'
import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import { connect } from 'react-redux'
import ColorHash from 'color-hash'
import fontColorContrast from 'font-color-contrast'
import moment from 'moment'
import { library as faLibrary } from '@fortawesome/fontawesome'
import distance from '@turf/distance'
import bearing from '@turf/bearing'
import { getCoords } from '@turf/invariant'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import faCalendar from '@fortawesome/fontawesome-free-solid/faCalendar'
import faCalendarCheck from '@fortawesome/fontawesome-free-solid/faCalendarCheck'
import faLocationArrow from '@fortawesome/fontawesome-free-solid/faLocationArrow'
import importedComponent from 'react-imported-component'
import gravatar from 'gravatar'

const MarkerMap = importedComponent(() => import('../mapping/MarkerMap'))

import { getCurrentLocation } from '../../selectors/geocache'
import { getCurrentUser } from '../../selectors/auth'
import { Model, withModelData } from '../../store'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

faLibrary.add(faCalendar, faCalendarCheck, faLocationArrow)

const Events = new Model('events')
const hasher = new ColorHash({lightness: 0.8})
const buttonHasher = new ColorHash()
const colorForEvent = evt => hasher.hex(evt.uid || '')

const locationDisplay = (evt, currentLocation) => {
    if (currentLocation) {
        return evt.location.raw + ' - ' + Math.round(distance(currentLocation, evt.geo, {units: 'miles'})) + ' miles'
    } else {
        return evt.location.raw
    }
}

export const CheckInButton = props => {
    const haveCheckedIn = props.checkedIn
    const distanceFromHere = distance(props.currentLocation ? props.currentLocation : props.event.geo, props.event.geo, {units: 'miles'})
    const isNearby = distanceFromHere < 0.25
    const canCheckIn = !haveCheckedIn && props.onCheckIn && isNearby
    const attendeeCount = props.event.attendees.length - (haveCheckedIn ? 1 : 0)
    // FIXME: Move all this 'can the user check in?' logic to backend
    const isInPast = props.event.end_timestamp.isSameOrBefore(moment().add(-1, 'hour'))
    const hasNotStarted = props.event.timestamp.isSameOrAfter(moment().add(30, 'minutes'))

    if (haveCheckedIn) {
        return (
            <React.Fragment>
                <Grid item><Badge color="primary" badgeContent={<FontAwesomeIcon icon={['fa', 'calendar-check']} />}><Avatar src={gravatar.url(props.currentUser.email, {s:32, d: 'retro'})} className={props.classes.checkedInBadge} /></Badge></Grid>
                <Grid item><p>You and {attendeeCount} others checked in.</p></Grid>
            </React.Fragment>
        )
    } else if (canCheckIn) {
        return (
            <React.Fragment>
                <Grid item><Button style={{backgroundColor: buttonHasher.hex(props.event.uid)}} variant="outlined" size="large" className={props.classes.checkInButton} onClick={() => props.onCheckIn(props.event)}>
                    <FontAwesomeIcon icon={['fa', 'calendar']} />
                </Button></Grid>
                <Grid item><p><em>{attendeeCount > 0 ? attendeeCount + ' other people checked in.' : 'Be the first to check in!'}</em></p></Grid>
            </React.Fragment>
        )
    } else if (isInPast) {
        return <Grid item><p>This event already happened.</p></Grid>
    } else if (hasNotStarted) {
        return <Grid item><p>This event hasn&apos;t started yet.</p></Grid>
    } else {
        const eventBearing = props.currentLocation ? bearing(props.currentLocation, props.event.geo) - 45 : 0
        return (
            <React.Fragment>
                <Grid item><Avatar className={props.classes.eventLocator}>
                    <FontAwesomeIcon icon={['fa', 'location-arrow']}  style={{transform: 'rotate('+eventBearing+'deg)'}}/>
                </Avatar></Grid>
                <Grid item><p>{attendeeCount > 0 ? attendeeCount + ' people are checked in here.' : 'You are too far away to check in.'}</p></Grid>
            </React.Fragment>
        )
    }
}

export const EventCard = props => {
    const cardColor = colorForEvent(props.event)
    const textColor = fontColorContrast(cardColor)

    const background = '-webkit-linear-gradient(left, ' + cardColor + ' 0%, ' + cardColor + 'aa 70%, ' + cardColor + '00 100%)'

    return (
        <Card className={props.className} style={{backgroundColor: cardColor, color: textColor}}>
            <CardContent style={{position: 'relative', zIndex: 1}}>
                <div style={{width: '175%', height: '100%', overflow: 'hidden', top: 0, left: 0, flex: 'auto', display: 'flex', position: 'absolute', zIndex: -1}}>
                    <MarkerMap position={getCoords(props.event.geo)} center={getCoords(props.event.geo)} />
                </div>
                <div style={{width: '100%', height: '100%', top: 0, left: 0, position: 'absolute', zIndex: -1, background: background}} />
                <Grid style={{flexWrap: 'nowrap'}} direction="row" spacing={8} alignItems="stretch" container>
                    <Grid xs item>
                        <Typography variant="headline">{props.event.name}</Typography>
                        <Typography variant="subheading">{props.event.timestamp.calendar()} - {props.event.end_timestamp.calendar()}</Typography>
                        <p>{locationDisplay(props.event, props.currentLocation)}</p>
                    </Grid>
                </Grid>
            </CardContent>
            <CardActions>
                <Grid spacing={8} container><CheckInButton {...props} /></Grid>
            </CardActions>
        </Card>
    )
}

EventCard.propTypes = {
    event: PropTypes.object.isRequired,
    currentLocation: PropTypes.object
}

EventCard.defaultProps = {
    classes: {}
}

const mapStateToProps = (state, props) => {
    const currentUser = getCurrentUser(state)
    const evt = Events.immutableSelect(state).map(evt => ({...evt, timestamp: moment(evt.timestamp), end_timestamp: moment(evt.end_timestamp)})).get(props.event_id)
    const checkedIn = evt.attendees.indexOf(currentUser.email) != -1
    const currentLocation = getCurrentLocation(state)
    return {
        currentUser,
        event: evt,
        checkedIn,
        currentLocation
    }
}

const styles = {
    checkedInBadge: {
        backgroundColor: '#3a5',
        minWidth: 0
    },
    checkInButton: {
        backgroundColor: '#ddd',
        minWidth: 0
    },
    eventLocator: {
        backgroundColor: '#33f',
        minWidth: 0
    }
}

const mapPropsToModels = props => {
    return {
        events: props.event_id
    }
}

export default withStyles(styles)(connect(mapStateToProps)(withModelData(mapPropsToModels)(EventCard)))