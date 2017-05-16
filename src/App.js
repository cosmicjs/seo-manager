import React, { Component } from 'react';
import config from './config'
import { eachSeries } from 'async'
import { Table, Input, Message, Icon, Menu, Modal, Button } from 'semantic-ui-react'
import _ from 'lodash'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      data: {}
    }
  }
  componentDidMount() {
    this.getObjects()
  }
  getObjects() {
    const endpoint = config.api_url + '/objects'
    fetch(endpoint).then(response => {
      return response.json()
    }).then(response => {
      const data = this.state.data
      if (response.error) {
        data.error = true
        this.setState({
          data
        })
        return 
      }
      const objects = response.objects
      data.objects = objects
      data.objects.forEach(object => {
        if (object && object.metadata) {
          const seo_score = this.getSEOScore(object.metadata.seo_keyword, object)
          object.seo_score = seo_score
        }
      })
      data.objects_by_type = _.groupBy(data.objects, 'type_slug')
      data.object_types = _.uniqBy(_.map(data.objects, 'type_slug'))
      const object_types_ordered = _.sortBy(_.groupBy(data.objects, 'type_slug'), value => - value.length)
      data.current_type = object_types_ordered[0][0].type_slug
      this.setState({
        data
      })
    })
  }
  saveSEOKeywords() {
    const endpoint = config.api_url + '/edit-object'
    const data = this.state.data
    const objects = data.objects
    eachSeries(objects, (object, callback) => {
      if (!object.metadata || !object.metadata.seo_keyword)
        return callback()
      // Filter current seo_keyword metafield
      const current_metafields = object.metafields.filter(metafield => {
        return metafield.key !== 'seo_keyword'
      })
      const new_object = {
        slug: object.slug,
        metafields: [
          ...current_metafields,
          {
            type: 'text',
            title: 'SEO Keyword',
            key: 'seo_keyword',
            value: object.metadata.seo_keyword
          }
        ]
      }
      const options = {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(new_object)
      }
      fetch(endpoint, options).then(response => {
        return response.json()
      }).then(response => {
        callback()
      })
    }, () => {
      const data = this.state.data
      delete data.saving
      data.message = {
        text: 'Keywords Saved!',
        color: 'green'
      }
      this.setState({
        data
      })
      setTimeout(() => {
        delete data.message
        this.setState({
          data
        })
      }, 2000)
    })
  }
  handleSaveClick() {
    const data = this.state.data
    data.saving = true
    this.setState({
      data
    })
    this.saveSEOKeywords()
  }
  handleKeywordChange(object, e) {
    const data = this.state.data
    const objects = data.objects
    const _id = object._id
    const value = e.target.value.trim()
    const seo_score = this.getSEOScore(value, object)
    objects.forEach(object => {
      if (object._id === _id) {
        if (!object.metadata)
          object.metadata = {}
        object.metadata.seo_keyword = value
        object.seo_score = seo_score
      }
    })
    this.setState({
      data
    })
  }
  getSEOScore(keyword, object) {
    delete object.appears_in_title
    delete object.appears_in_content
    if (!keyword)
      return 0
    if (object.title.toLowerCase().search(keyword.toLowerCase()) !== -1 && object.content.toLowerCase().search(keyword.toLowerCase()) !== -1) {
      object.appears_in_title = true
      object.appears_in_content = true
      return 100
    }
    if (object.title.toLowerCase().search(keyword.toLowerCase()) !== -1) {
      object.appears_in_title = true
      return 50
    }
    if (object.content.toLowerCase().search(keyword.toLowerCase()) !== -1) {
      object.appears_in_content = true
      return 50
    }
    return 0
  }
  getMessage() {
    const data = this.state.data
    const message = data.message
    if (message)
      return <Message color={ message.color }>{ message.text }</Message>
  }
  handleItemClick(e, { name }) {
    const data = this.state.data
    data.current_type = name
    this.setState({
      data
    })
  }
  openObjectModal(object) {
    const data = this.state.data
    data.current_object = object
    this.setState({
      data
    }) 
  }
  closeObjectModal() {
    const data = this.state.data
    delete data.current_object
    this.setState({
      data
    }) 
  }
  getLoading() {
    return <div style={{ width: '100%', textAlign: 'center', paddingTop: 100 }}><Icon color="blue" name="circle notched" loading /></div>
  }
  getError() {
    return <div style={{ width: '100%', textAlign: 'center', padding: 100 }}><Message error>There was an error with this request.  Make sure the Bucket exists and your access connections are correct.</Message></div>
  }
  getContent() {
    const data = this.state.data
    if (data.current_object.metadata && data.current_object.metadata.seo_keyword && data.current_object.content)
      return <div dangerouslySetInnerHTML={{ __html: data.current_object.content.replace(new RegExp(data.current_object.metadata.seo_keyword, 'ig'), '<b class="ui green header">' + data.current_object.metadata.seo_keyword.toUpperCase() + '</b>') }}/>
    if (data.current_object.content)
      return <div dangerouslySetInnerHTML={{ __html: data.current_object.content }}/>
    else
      return <Message>This Object has no content.</Message>
  }
  render() {
    const data = this.state.data
    if (data.error)
      return this.getError()
    if (!data.object_types)
      return this.getLoading()
    return (
      <div style={{ padding: 15 }}>
        <h1>SEO Manager</h1>
        <Menu tabular>
          {
            data.object_types.map(type => {
              return <Menu.Item key={ 'key-' + type } name={ type } active={data.current_type === type} onClick={this.handleItemClick.bind(this)} />
            })
          }
        </Menu>
        <Table celled striped selectable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell style={{ width: '30%' }}>Title</Table.HeaderCell>
              <Table.HeaderCell style={{ width: '20%' }}>Type</Table.HeaderCell>
              <Table.HeaderCell style={{ width: '20%' }}>Keyword</Table.HeaderCell>
              <Table.HeaderCell style={{ width: '20%' }}>Appearence</Table.HeaderCell>
              <Table.HeaderCell style={{ width: '10%' }}>Score</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {
              data.objects_by_type && data.objects_by_type[data.current_type] && data.objects_by_type[data.current_type].length &&
              data.objects_by_type[data.current_type].map(object => {
                return (
                  <Table.Row key={ object.slug }>
                    <Table.Cell style={{ cursor: 'pointer' }} onClick={ this.openObjectModal.bind(this, object) }>{ object.title }</Table.Cell>
                    <Table.Cell style={{ cursor: 'pointer' }} onClick={ this.openObjectModal.bind(this, object) }><code>{ object.type_slug }</code></Table.Cell>
                    <Table.Cell><Input style={{ width: '100%' }} onChange={ this.handleKeywordChange.bind(this, object) } placeholder="Add your SEO target keyword" className="form-control" type="text" defaultValue={ object.metadata ? object.metadata.seo_keyword : '' } /></Table.Cell>
                    <Table.Cell style={{ cursor: 'pointer' }} onClick={ this.openObjectModal.bind(this, object) }>
                      <div>Title { object.appears_in_title ? <span><Icon color="green" name="checkmark" />Yes!</span> : <span><Icon color="red" name="remove" />No</span> }</div>
                      <div>Content { object.appears_in_content ? <span><Icon color="green" name="checkmark" />Yes!</span> : <span><Icon color="red" name="remove" />No</span> }</div>
                    </Table.Cell>
                    <Table.Cell style={{ cursor: 'pointer' }} onClick={ this.openObjectModal.bind(this, object) }>{ object.seo_score ? object.seo_score : 0 }</Table.Cell>
                  </Table.Row>
                )
              })
            }
          </Table.Body>
        </Table>
        {
          data.current_object &&
          <Modal open={ data.current_object ? true : false } onClose={ this.closeObjectModal.bind(this) }>
            <Modal.Header>{ data.current_object.title }</Modal.Header>
            <Modal.Content>
              <Modal.Description>
                { this.getContent() }
              </Modal.Description>
            </Modal.Content>
            <Modal.Actions>
              <Button primary onClick={ this.closeObjectModal.bind(this) }>
                Ok
              </Button>
            </Modal.Actions>
          </Modal>
        }
        { this.getMessage() }
        <Button onClick={ this.handleSaveClick.bind(this) } primary disabled={ data.saving ? true : false }>
          { data.saving ? 'Saving...' : 'Save SEO Keywords to Objects' }
        </Button>
      </div>
    )
  }
}

export default App;
