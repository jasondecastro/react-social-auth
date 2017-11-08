import _ from 'lodash/fp'
import { getQueryParameter } from './common'
import generateState from 'simple-random/browser'

let loadAuthorizationUrl = ({ appId, state, scope }) => {
  let current = encodeURIComponent(window.location.href)
  let base =
    'https://www.linkedin.com/oauth/v2/authorization?response_type=code&'
  return `${base}client_id=${appId}&redirect_uri=${current}&state=${state}&scope=${encodeURIComponent(
    scope
  )}`
}

let resetUrl = () => {
  if (typeof window !== 'undefined') {
    let code = getQueryParameter('code')
    let state = getQueryParameter('state')
    let newURL = window.location.href.replace(`code=${code}&state=${state}`, '')

    if (newURL.endsWith('?')) {
      newURL = newURL.slice(0, -1)
    }

    window.history.replaceState(null, null, newURL)
    localStorage.linkedInReactLogin = ''
    localStorage.linkedInReactLoginRedirectUri = ''
  }
}

let getAuthenticationCode = () => {
  if (typeof localStorage !== 'undefined') {
    let state = localStorage.linkedInReactLogin
    let redirectUri = localStorage.linkedInReactLoginRedirectUri
    if (
      !redirectUri ||
      !state ||
      state !== getQueryParameter('state') ||
      !getQueryParameter('code')
    ) {
      return
    }
    state = getQueryParameter('state')
    let authenticationCode = getQueryParameter('code')
    resetUrl()
    return { authenticationCode, state }
  }
}

let requestAuthenticationCode = ({ appId, scope }) => {
  let state = generateState({ length: 8 })
  localStorage.linkedInReactLogin = state
  localStorage.linkedInReactLoginRedirectUri = window.location.href
  window.location.href = loadAuthorizationUrl({ appId, state, scope })
}

let getAuthPayload = (appId) => {
  let result = getAuthenticationCode()
  if (result) {
    let { authenticationCode, state } = result
    return {
      type: 'linkedin',
      authResponse: {
        grant_type: 'authorization_code',
        code: authenticationCode,
        client_id: appId,
        redirect_uri: window.location.href,
      },
    }
  }
}

export let onMount = ({appId, onSuccess}) => {
  let authPayload = getAuthPayload(appId)
  if (authPayload) {
    onSuccess(authPayload)
  }
} 

export let onClick = ({ appId, scope = 'r_basicprofile r_emailaddress' }) => {
  requestAuthenticationCode({ appId, scope })
}