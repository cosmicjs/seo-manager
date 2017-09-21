import helpers from './helpers'
const bucket_slug = helpers.getParameterByName('bucket_slug')
const read_key = helpers.getParameterByName('read_key')
const write_key = helpers.getParameterByName('write_key')
const api_base = 'https://api.cosmicjs.com'
const api_version = 'v1'
const api_url = api_base +'/' + api_version + '/' + bucket_slug
const config = {
  api_url,
  read_key,
  write_key,
}
export default config