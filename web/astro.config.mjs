import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

export default defineConfig({
  output: 'static',
  integrations: [mdx()],
  markdown: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeRaw]
  }
});
