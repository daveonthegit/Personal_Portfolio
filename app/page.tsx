import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Download, Github, Linkedin, Mail, Eye, Code, Zap } from 'lucide-react'
import { allProjects } from 'contentlayer/generated'
import { ProjectCardCompact } from '@/components/ProjectCard'

export default function HomePage() {
  // Get the 3 most recent projects
  const featuredProjects = allProjects
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  const stats = [
    { label: 'Projects Completed', value: '15+', icon: Code },
    { label: 'Technologies Mastered', value: '20+', icon: Zap },
    { label: 'Years Experience', value: '5+', icon: Eye },
  ]

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            {/* Profile Image */}
            <div className="relative w-32 h-32 mx-auto">
              <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-1">
                <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-600 dark:text-gray-400">YN</span>
                </div>
              </div>
            </div>

            {/* Name and Title */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white">
                <span className="block">Your Name</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Full-Stack Developer
                </span>
              </h1>
              
              <p className="max-w-3xl mx-auto text-xl sm:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Creating interactive experiences with modern web technologies, 
                <span className="text-blue-600 dark:text-blue-400 font-medium"> 3D graphics</span>, and
                <span className="text-purple-600 dark:text-purple-400 font-medium"> cutting-edge design</span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/projects"
                className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2 group"
              >
                View My Work
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-lg px-8 py-4 inline-flex items-center gap-2"
              >
                <Download className="h-5 w-5" />
                Download Resume
              </Link>
            </div>

            {/* Social Links */}
            <div className="flex justify-center gap-6 pt-8">
              <a
                href="https://github.com/yourusername"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                title="GitHub"
              >
                <Github className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </a>
              <a
                href="https://linkedin.com/in/yourusername"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                title="LinkedIn"
              >
                <Linkedin className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </a>
              <a
                href="mailto:your.email@example.com"
                className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                title="Email"
              >
                <Mail className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors mb-4">
                    <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Projects
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              A selection of my recent work showcasing different technologies and creative approaches
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredProjects.map((project) => (
              <ProjectCardCompact
                key={project._id}
                project={project}
                className="h-80"
              />
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/projects"
              className="btn-primary inline-flex items-center gap-2 group"
            >
              View All Projects
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Skills Preview */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Skills & Expertise
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Technologies I work with to bring ideas to life
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {[
              'React', 'Next.js', 'TypeScript', 'Node.js', 'Three.js', 'Tailwind CSS',
              'Python', 'PostgreSQL', 'AWS', 'Docker', 'Figma', 'Blender'
            ].map((skill) => (
              <div
                key={skill}
                className="text-center group cursor-pointer"
              >
                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors mb-3">
                  <span className="text-2xl font-bold text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {skill.slice(0, 2)}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {skill}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/about"
              className="btn-secondary inline-flex items-center gap-2"
            >
              Learn More About Me
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

// Background grid pattern (add to globals.css if needed)
const gridPattern = `
  .bg-grid-pattern {
    background-image: 
      linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px);
    background-size: 20px 20px;
  }
`
