'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, X } from 'lucide-react'
// Temporary: commenting out contentlayer import to fix build
// import { allProjects } from 'contentlayer/generated'
// import ProjectCard from '@/components/ProjectCard'

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date')

  // Temporary: using mock data instead of contentlayer
  const allProjects = [
    {
      _id: '1',
      title: 'E-Commerce Platform',
      summary: 'Modern e-commerce with 3D product visualization',
      date: '2024-01-15',
      url: '/projects/sample-project',
      hero: '/assets/images/project-hero.jpg',
      tags: ['Next.js', 'Three.js', 'TypeScript', 'E-commerce']
    },
    {
      _id: '2', 
      title: 'Architectural Visualization',
      summary: 'Real-time 3D building exploration platform',
      date: '2023-11-20',
      url: '/projects/sample-project-2',
      hero: '/assets/images/project-hero-2.jpg',
      tags: ['React', 'WebGL', 'Architecture', 'Three.js']
    }
  ]

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    allProjects.forEach(project => {
      project.tags?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [])

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = allProjects.filter(project => {
      // Search by title and summary
      const searchMatch = searchTerm === '' || 
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.summary.toLowerCase().includes(searchTerm.toLowerCase())

      // Filter by tags
      const tagMatch = selectedTags.length === 0 || 
        selectedTags.every(tag => project.tags?.includes(tag))

      return searchMatch && tagMatch
    })

    // Sort projects
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      } else {
        return a.title.localeCompare(b.title)
      }
    })

    return filtered
  }, [searchTerm, selectedTags, sortBy])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedTags([])
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Projects
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            A comprehensive collection of my work, from web applications to interactive 3D experiences
          </p>
          <div className="mt-6 text-sm text-gray-500 dark:text-gray-500">
            {filteredProjects.length} of {allProjects.length} projects
          </div>
        </div>

        {/* Filters */}
        <div className="mb-12 space-y-6">
          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>

          {/* Tag Filters */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">Filter by Technology</span>
              {(selectedTags.length > 0 || searchTerm) && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  Clear all
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {tag}
                  {selectedTags.includes(tag) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded text-sm"
                >
                  {tag}
                  <button
                    onClick={() => toggleTag(tag)}
                    className="hover:text-blue-600 dark:hover:text-blue-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <div key={project._id} className="card p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {project.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {project.summary}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags?.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                  {new Date(project.date).toLocaleDateString()}
                </div>
                <a href={project.url} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                  View Project →
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No projects found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={clearAllFilters}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Load More (if implementing pagination) */}
        {filteredProjects.length >= 12 && (
          <div className="text-center mt-16">
            <button className="btn-secondary">
              Load More Projects
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
