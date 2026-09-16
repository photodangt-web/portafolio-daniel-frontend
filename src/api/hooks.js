import { useQuery } from '@tanstack/react-query'
import { portfolioApi } from './portfolio'

const queryOptions = {
  staleTime: 5 * 60 * 1000,
  retry: 1,
}

export function useProfileQuery() {
  return useQuery({ queryKey: ['profile'], queryFn: portfolioApi.getProfile, ...queryOptions })
}

export function useSkillsQuery() {
  return useQuery({ queryKey: ['skills'], queryFn: portfolioApi.getSkills, ...queryOptions })
}

export function useExperienceQuery() {
  return useQuery({ queryKey: ['experience'], queryFn: portfolioApi.getExperience, ...queryOptions })
}

export function useProjectsQuery() {
  return useQuery({ queryKey: ['projects'], queryFn: portfolioApi.getProjects, ...queryOptions })
}
