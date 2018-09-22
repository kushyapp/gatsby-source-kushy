const crypto = require('crypto')
const fetch = require('node-fetch')
const queryString = require('query-string')
// const helpers = require(`./helpers`)


exports.sourceNodes = ({ actions, createNodeId }, configOptions) => {
  const { createNode } = actions

  // Gatsby adds a configOption that's not needed for this plugin, delete it
  delete configOptions.plugins
  
  const fetchData = (url, section, type) => {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        data.data.forEach(post => {
          console.log(section, post)
          // Process data to create a GraphQL node matching the structure of the API
          const nodeData = processPost(post, section, type)
          // Use Gatsby's createNode helper to create a node from the node data
          createNode(nodeData)
        })
      })
  }

  const fetchMenu = slug => {
    const url = `http://localhost/api/v1/inventory/menu/${slug}`
    fetchData(url, 'menu', 'KushyMenu')
  }

  const fetchPhotos = id => {
    const url = `http://localhost/api/v1/photos/post/${id}`
    fetchData(url, 'photo', 'KushyPhoto')
  }

  const fetchReviews = id => {
    const url = `http://localhost/api/v1/reviews/post/${id}`
    fetchData(url, 'review', 'KushyReview')
  }

  // Helper function that processes a photo to match Gatsby's node structure
  const processPost = (post, section, type) => {
    const nodeId = createNodeId(`kushy-${section}-${post.id}`)
    console.log('post', post)
    const nodeContent = JSON.stringify(post)
    const nodeContentDigest = crypto
      .createHash('md5')
      .update(nodeContent)
      .digest('hex')

    const nodeData = Object.assign({}, post, {
      id: nodeId,
      parent: null,
      children: [],
      internal: {
        type,
        content: nodeContent,
        contentDigest: nodeContentDigest,
      },
    })

    return nodeData
  }

  // Convert the options object into a query string
  // const apiOptions = queryString.stringify(configOptions)

  // Make sure user has added necessary config
  // If not, give them 5 recent dispensaries
  if (!configOptions.section && !configOptions.slug) {
    const apiUrl = `http://localhost/api/v1/shops/`
  }

  // Add parameters to the Kushy API URL
  const apiUrl = `http://localhost/api/v1/${configOptions.section}/?filter[slug]=${configOptions.slug}&include=categories`

  return (
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        data.data.forEach(post => {
          // Process data to create a GraphQL node matching the structure of the API
          const nodeData = processPost(post, 'post', 'KushyPost')
          // Use Gatsby's createNode helper to create a node from the node data
          createNode(nodeData)

          // Grab reviews and generate nodes
          const reviews = fetchReviews(post.id)
          // Grab reviews and generate nodes
          const photos = fetchPhotos(post.id)
          // Grab menu and generate nodes
          const menu = fetchMenu(post.slug)
        })
      })
  )
}
