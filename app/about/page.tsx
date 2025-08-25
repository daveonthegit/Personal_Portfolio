import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Download, MapPin, Calendar, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn more about my background, skills, and experience as a full-stack developer specializing in 3D web experiences.',
}

// Skills data
const skillCategories = [
  {
    title: 'Frontend Development',
    skills: [
      { name: 'React', level: 95, years: '4+ years' },
      { name: 'Next.js', level: 90, years: '3+ years' },
      { name: 'TypeScript', level: 85, years: '3+ years' },
      { name: 'Tailwind CSS', level: 88, years: '2+ years' },
    ],
  },
  {
    title: '3D & Graphics',
    skills: [
      { name: 'Three.js', level: 82, years: '2+ years' },
      { name: 'React Three Fiber', level: 80, years: '2+ years' },
      { name: 'Blender', level: 75, years: '3+ years' },
      { name: 'WebGL', level: 70, years: '1+ years' },
    ],
  },
  {
    title: 'Backend Development',
    skills: [
      { name: 'Node.js', level: 85, years: '4+ years' },
      { name: 'Python', level: 80, years: '5+ years' },
      { name: 'PostgreSQL', level: 78, years: '3+ years' },
      { name: 'AWS', level: 75, years: '2+ years' },
    ],
  },
  {
    title: 'Tools & Design',
    skills: [
      { name: 'Figma', level: 85, years: '3+ years' },
      { name: 'Git', level: 90, years: '5+ years' },
      { name: 'Docker', level: 72, years: '2+ years' },
      { name: 'Photoshop', level: 70, years: '4+ years' },
    ],
  },
]

const timeline = [
  {
    year: '2024',
    title: 'Senior Full-Stack Developer',
    company: 'Tech Innovation Corp',
    description: 'Leading development of 3D web applications and interactive experiences.',
    current: true,
  },
  {
    year: '2022',
    title: 'Full-Stack Developer',
    company: 'Digital Solutions Inc',
    description: 'Developed modern web applications with React, Node.js, and cloud technologies.',
  },
  {
    year: '2020',
    title: 'Frontend Developer',
    company: 'Creative Agency',
    description: 'Specialized in creating engaging user interfaces and interactive web experiences.',
  },
  {
    year: '2019',
    title: 'Computer Science Graduate',
    company: 'University Name',
    description: 'Bachelor\'s degree in Computer Science with focus on graphics and web development.',
  },
]

const interests = [
  {
    title: '3D Art & Animation',
    description: 'Creating digital art and animations using Blender and other 3D tools',
    icon: '🎨',
  },
  {
    title: 'Game Development',
    description: 'Building interactive experiences and small games in my spare time',
    icon: '🎮',
  },
  {
    title: 'Photography',
    description: 'Capturing moments and exploring composition and lighting techniques',
    icon: '📸',
  },
  {
    title: 'Open Source',
    description: 'Contributing to open source projects and sharing knowledge with the community',
    icon: '🚀',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
                  About Me
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                  I'm a passionate full-stack developer who loves creating interactive web experiences 
                  that blend cutting-edge technology with beautiful design.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Get in Touch
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Resume
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>San Francisco, CA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Available for projects</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative w-80 h-80 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative w-full h-full rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  {/* Replace with actual photo */}
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-6xl font-bold text-white">YN</span>
                  </div>
                  {/* Uncomment when you have a photo */}
                  {/* <Image
                    src="/assets/profile-photo.jpg"
                    alt="Your Name"
                    fill
                    className="object-cover"
                    priority
                  /> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              My Story
            </h2>
            
            <div className="space-y-6 text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>
                My journey into web development started during college when I discovered the perfect 
                intersection of creativity and logic that programming offers. What began as curiosity 
                about how websites work evolved into a deep passion for creating digital experiences 
                that users love.
              </p>
              
              <p>
                Over the past 5+ years, I've had the privilege of working with diverse teams and 
                projects, from early-stage startups to established companies. Each experience has 
                taught me something new about the craft of building software and the importance of 
                user-centered design.
              </p>
              
              <p>
                What sets me apart is my fascination with 3D graphics and interactive media. I believe 
                the web is evolving beyond traditional 2D interfaces, and I'm excited to be part of 
                that transformation. Whether it's creating immersive product visualizations or 
                building interactive storytelling experiences, I love pushing the boundaries of what's 
                possible in the browser.
              </p>
              
              <p>
                When I'm not coding, you'll find me experimenting with Blender, contributing to open 
                source projects, or exploring the latest developments in web technologies. I'm always 
                eager to learn new things and share knowledge with the community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Skills & Expertise
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Here's a breakdown of my technical skills and the tools I use to bring ideas to life
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {skillCategories.map((category) => (
              <div key={category.title} className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  {category.title}
                </h3>
                
                <div className="space-y-4">
                  {category.skills.map((skill) => (
                    <div key={skill.name}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {skill.name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-500">
                          {skill.years}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Experience Timeline
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              My professional journey and key milestones
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
            
            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div key={index} className="relative flex items-start">
                  {/* Timeline dot */}
                  <div className={`relative z-10 w-4 h-4 rounded-full border-4 border-white dark:border-gray-900 ${
                    item.current 
                      ? 'bg-blue-600' 
                      : 'bg-gray-400 dark:bg-gray-600'
                  }`}>
                  </div>
                  
                  {/* Content */}
                  <div className="ml-6 flex-1">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {item.title}
                        </h3>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          item.current
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {item.year}
                        </span>
                      </div>
                      <div className="text-blue-600 dark:text-blue-400 font-medium mb-2">
                        {item.company}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interests Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Beyond Code
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              What I'm passionate about outside of work
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {interests.map((interest, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{interest.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {interest.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {interest.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Let's Build Something Amazing Together
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            I'm always interested in hearing about new projects and opportunities. 
            Whether you have a question or just want to say hello, I'd love to hear from you.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="btn-primary inline-flex items-center gap-2"
            >
              Start a Conversation
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/projects"
              className="btn-secondary inline-flex items-center gap-2"
            >
              View My Work
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
