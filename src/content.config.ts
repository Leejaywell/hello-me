import { defineCollection } from 'astro:content'
import { z } from 'astro:schema'
import { glob } from 'astro/loaders'
import { TIMELINE_TYPES } from './lib/timeline'

const about = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/about' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    avatar: z.string().optional(),
    socials: z.array(z.object({ name: z.string(), url: z.string(), icon: z.string() })).default([]),
  }),
})

const timeline = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/timeline' }),
  schema: z.object({
    date: z.coerce.date(),
    title: z.string(),
    type: z.enum(TIMELINE_TYPES.filter((t) => t !== 'all') as [string, ...string[]]),
    icon: z.string().default('•'),
    link: z.string().optional(),
  }),
})

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
})

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    role: z.string().optional(),
    tags: z.array(z.string()).default([]),
    url: z.string().optional(),
    cover: z.string().optional(),
    description: z.string(),
  }),
})

export const collections = { about, timeline, blog, projects }
