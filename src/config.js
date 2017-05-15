import helpers from './helpers'
const bucket_slug = helpers.getParameterByName('bucket_slug')
const api_base = 'https://api.cosmicjs.com'
const api_version = 'v1'
const api_url = api_base +'/' + api_version + '/' + bucket_slug
export default {
  api_url
}