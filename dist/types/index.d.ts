export interface Project {
    id: string;
    title: string;
    description: string;
    image: string;
    technologies: string[];
    github_url: string;
    live_url: string;
    date: string;
}
export interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}
export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    message: string;
    data?: T;
}
export interface ThemeState {
    isDark: boolean;
    toggle: () => void;
    init: () => void;
    applyTheme: () => void;
}
export interface ProjectFilterState {
    selectedTechnology: string;
    filteredProjects: Project[];
    setFilter: (tech: string) => void;
    getAllTechnologies: () => string[];
    getAllProjects: () => Project[];
}
//# sourceMappingURL=index.d.ts.map