import { defineDocumentType, makeSource } from 'contentlayer/source-files'

export const Project = defineDocumentType(() => ({
  name: 'Project',
  filePathPattern: `projects/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: {
      type: 'string',
      description: 'The title of the project',
      required: true,
    },
    date: {
      type: 'date',
      description: 'The date of the project',
      required: true,
    },
    summary: {
      type: 'string',
      description: 'A brief summary of the project',
      required: true,
    },
    tags: {
      type: 'list',
      of: { type: 'string' },
      description: 'Tags for categorizing the project',
      required: false,
    },
    hero: {
      type: 'string',
      description: 'Hero image URL for the project',
      required: false,
    },
    repoUrl: {
      type: 'string',
      description: 'GitHub repository URL',
      required: false,
    },
    liveUrl: {
      type: 'string',
      description: 'Live demo URL',
      required: false,
    },
    modelSlug: {
      type: 'string',
      description: 'Slug for 3D model viewer',
      required: false,
    },
    videoId: {
      type: 'string',
      description: 'Video ID for Mux or Cloudflare Stream',
      required: false,
    },
    metrics: {
      type: 'nested',
      of: {
        performance: { type: 'string' },
        users: { type: 'string' },
        conversion: { type: 'string' },
      },
      required: false,
    },
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (project) => `/projects/${project._raw.flattenedPath.replace('projects/', '')}`,
    },
    slug: {
      type: 'string',
      resolve: (project) => project._raw.flattenedPath.replace('projects/', ''),
    },
  },
}))

export default makeSource({
  contentDirPath: './content',
  documentTypes: [Project],
  mdx: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})
