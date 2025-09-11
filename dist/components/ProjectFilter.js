export function ProjectFilter() {
    return {
        selectedTechnology: 'all',
        get filteredProjects() {
            const projects = this.getAllProjects();
            if (this.selectedTechnology === 'all') {
                return projects;
            }
            return projects.filter((project) => project.technologies.includes(this.selectedTechnology));
        },
        setFilter(tech) {
            this.selectedTechnology = tech;
            // Add smooth transition effect
            const projectGrid = document.querySelector('.project-grid');
            if (projectGrid) {
                projectGrid.classList.add('filtering');
                setTimeout(() => {
                    projectGrid.classList.remove('filtering');
                }, 300);
            }
        },
        getAllTechnologies() {
            const projects = this.getAllProjects();
            const techSet = new Set();
            projects.forEach((project) => {
                project.technologies.forEach((tech) => techSet.add(tech));
            });
            return Array.from(techSet).sort();
        },
        getAllProjects() {
            // In a real app, this might come from an API or be passed as props
            // For now, we'll get it from a global variable set by the Go template
            return window.portfolioProjects || [];
        }
    };
}
//# sourceMappingURL=ProjectFilter.js.map