const { createRemoteFileNode } = require(`gatsby-source-filesystem`)

// Downloads media files and removes "sizes" data as useless in Gatsby context.
exports.downloadMediaFiles = async ({
  entities,
  store,
  cache,
  createNode,
  createNodeId,
  touchNode,
  _auth,
}) =>
  Promise.all(
    entities.map(async e => {
      let fileNodeID
      if (e.__type === `wordpress__wp_media`) {
        const mediaDataCacheKey = `wordpress-media-${e.wordpress_id}`
        const cacheMediaData = await cache.get(mediaDataCacheKey)

        // If we have cached media data and it wasn't modified, reuse
        // previously created file node to not try to redownload
        if (cacheMediaData && e.modified === cacheMediaData.modified) {
          fileNodeID = cacheMediaData.fileNodeID
          touchNode({ nodeId: cacheMediaData.fileNodeID })
        }

        // If we don't have cached data, download the file
        if (!fileNodeID) {
          try {
            const fileNode = await createRemoteFileNode({
              url: e.source_url,
              store,
              cache,
              createNode,
              createNodeId,
              auth: _auth,
            })

            if (fileNode) {
              fileNodeID = fileNode.id

              await cache.set(mediaDataCacheKey, {
                fileNodeID,
                modified: e.modified,
              })
            }
          } catch (e) {
            // Ignore
          }
        }
      }

      if (fileNodeID) {
        e.localFile___NODE = fileNodeID
        delete e.media_details.sizes
      }

      return e
    })
  )
