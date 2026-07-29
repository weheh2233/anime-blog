import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { SITE } from '../consts';

const POST_DIR = 'src/content/posts';
const PUBLIC_IMAGE_DIR = 'public/images';
const IMAGE_EXTENSIONS = new Set(['avif', 'bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp']);
const ZONES = new Set(['学习', '编程', '生活', '运动', '娱乐', '社交']);
const DEFAULT_ZONE = '编程';
const GITHUB_OWNER = 'weheh2233';
const GITHUB_REPO = 'anime-blog';

export type UploadedAsset = {
  name: string;
  data: Uint8Array;
  type?: string;
};

export type ImportInput = {
  articleName: string;
  articleText: string;
  assets: UploadedAsset[];
  githubAccessToken?: string;
  overrides?: {
    title?: string;
    description?: string;
    author?: string;
    publishDate?: string;
    zone?: string;
    tags?: string;
  };
};

type ParsedFrontmatter = Record<string, unknown>;

type PreparedFile = {
  repoPath: string;
  data: Uint8Array;
  text?: string;
};

export type PreparedPostImport = {
  slug: string;
  filename: string;
  frontmatter: {
    title: string;
    description: string;
    author: string;
    publishDate: string;
    zone: string;
    tags: string[];
    heroImage?: string;
    draft: true;
  };
  content: string;
  markdown: string;
  missingImages: string[];
  writtenImagePaths: string[];
  editUrl: string;
  files: PreparedFile[];
};

export type PersistedPostImport = Omit<PreparedPostImport, 'files'> & {
  committedVia: 'local' | 'github';
};

class ImportError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function isImportError(error: unknown): error is ImportError {
  return error instanceof ImportError;
}

export function parseFrontmatter(text: string): { data: ParsedFrontmatter; content: string } {
  const normalized = text.replace(/^\uFEFF/, '');
  const match = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(normalized);

  if (!match) {
    return { data: {}, content: normalized.trimStart() };
  }

  const parsed = yaml.load(match[1]);
  const data = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? parsed as ParsedFrontmatter
    : {};

  return {
    data,
    content: normalized.slice(match[0].length).trimStart(),
  };
}

export async function preparePostImport(input: ImportInput): Promise<PreparedPostImport> {
  if (!/\.(md|mdoc)$/i.test(input.articleName)) {
    throw new ImportError('只支持上传 .md 或 .mdoc 文件。');
  }

  const { data, content: rawContent } = parseFrontmatter(input.articleText);
  const baseTitle = asString(data.title) || filenameWithoutExt(input.articleName);
  const title = cleanSingleLine(input.overrides?.title) || cleanSingleLine(baseTitle);
  const description = cleanMultiline(input.overrides?.description)
    || cleanMultiline(asString(data.description))
    || deriveDescription(rawContent);
  const author = cleanSingleLine(input.overrides?.author)
    || cleanSingleLine(asString(data.author))
    || SITE.author;
  const publishDate = normalizeDate(input.overrides?.publishDate || data.publishDate);
  const zone = normalizeZone(input.overrides?.zone || data.zone);
  const tags = normalizeTags(input.overrides?.tags ?? data.tags);
  const baseSlug = slugifyPostTitle(title || filenameWithoutExt(input.articleName));
  const slug = await resolveUniqueSlug(baseSlug, input.githubAccessToken);
  const assetIndex = createAssetIndex(input.assets);
  const missingImages = new Set<string>();
  const files: PreparedFile[] = [];
  const writtenImagePaths: string[] = [];
  const usedTargetNames = new Set<string>();
  let heroImage = normalizePathLike(asString(data.heroImage));

  if (heroImage && isRelativeAssetPath(heroImage) && isImagePath(heroImage)) {
    const asset = findAsset(assetIndex, heroImage);
    if (!asset) {
      missingImages.add(heroImage);
    } else {
      const extension = getExtension(asset.name) || getExtension(heroImage) || 'png';
      const repoPath = toRepoPath(PUBLIC_IMAGE_DIR, slug, `heroImage.${extension}`);
      files.push({ repoPath, data: asset.data });
      heroImage = `/images/${encodeURIComponent(slug)}/heroImage.${extension}`;
      writtenImagePaths.push(heroImage);
    }
  }

  const content = rewriteMarkdownImages(rawContent, (source) => {
    if (!isRelativeAssetPath(source) || !isImagePath(source)) {
      return source;
    }

    const asset = findAsset(assetIndex, source);
    if (!asset) {
      missingImages.add(source);
      return source;
    }

    const targetName = uniqueAssetFilename(asset.name || source, usedTargetNames);
    const publicPath = `/images/${encodeURIComponent(slug)}/content/${encodeURIComponent(targetName)}`;
    const repoPath = toRepoPath(PUBLIC_IMAGE_DIR, slug, 'content', targetName);
    files.push({ repoPath, data: asset.data });
    writtenImagePaths.push(publicPath);
    return publicPath;
  }).trimEnd();

  if (missingImages.size > 0) {
    throw new ImportError(`缺少正文或封面引用的图片：${Array.from(missingImages).join('、')}`);
  }

  const frontmatter: PreparedPostImport['frontmatter'] = {
    title,
    description,
    author,
    publishDate,
    zone,
    tags,
    draft: true,
  };

  if (heroImage) {
    frontmatter.heroImage = heroImage;
  }

  const markdown = buildMdoc(frontmatter, content);
  const filename = `${slug}.mdoc`;
  files.unshift({
    repoPath: toRepoPath(POST_DIR, filename),
    data: new TextEncoder().encode(markdown),
    text: markdown,
  });

  return {
    slug,
    filename,
    frontmatter,
    content,
    markdown,
    missingImages: [],
    writtenImagePaths,
    editUrl: `/keystatic/collection/posts/item/${encodeURIComponent(slug)}`,
    files,
  };
}

export async function persistPostImport(
  prepared: PreparedPostImport,
  options: { githubAccessToken?: string } = {},
): Promise<PersistedPostImport> {
  const committedVia = process.env.NODE_ENV === 'production' ? 'github' : 'local';

  if (committedVia === 'github') {
    await commitFilesToGitHub(prepared.files, `import post draft: ${prepared.slug}`, options.githubAccessToken);
  } else {
    await writeFilesLocally(prepared.files);
  }

  const { files: _files, ...result } = prepared;
  return { ...result, committedVia };
}

function buildMdoc(frontmatter: PreparedPostImport['frontmatter'], content: string): string {
  const dumped = yaml.dump(frontmatter, {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  }).trimEnd();

  return `---\n${dumped}\n---\n${content.trimStart()}\n`;
}

async function writeFilesLocally(files: PreparedFile[]) {
  for (const file of files) {
    const target = path.resolve(process.cwd(), file.repoPath);
    assertWithinWorkspace(target);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.data);
  }
}

async function resolveUniqueSlug(baseSlug: string, githubAccessToken?: string): Promise<string> {
  let slug = baseSlug;
  let suffix = 2;

  while (await postExists(slug, githubAccessToken)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function postExists(slug: string, githubAccessToken?: string): Promise<boolean> {
  const repoPath = toRepoPath(POST_DIR, `${slug}.mdoc`);

  if (process.env.NODE_ENV === 'production') {
    const token = githubAccessToken || process.env.BLOG_IMPORT_GITHUB_TOKEN;
    if (!token) {
      return false;
    }
    const branch = process.env.BLOG_IMPORT_GITHUB_BRANCH || 'main';
    const res = await fetch(githubUrl(`/contents/${repoPath}?ref=${encodeURIComponent(branch)}`), {
      headers: githubHeaders(token),
    });
    if (res.status === 404) return false;
    if (!res.ok) throw new ImportError(`检查 GitHub 文件是否存在失败：${await res.text()}`, 502);
    return true;
  }

  try {
    await fs.access(path.resolve(process.cwd(), repoPath));
    return true;
  } catch {
    return false;
  }
}

async function commitFilesToGitHub(files: PreparedFile[], message: string, githubAccessToken?: string) {
  const token = githubAccessToken || process.env.BLOG_IMPORT_GITHUB_TOKEN;
  const branch = process.env.BLOG_IMPORT_GITHUB_BRANCH || 'main';

  if (!token) {
    throw new ImportError('未找到可用于写入 GitHub 的登录凭据，请重新登录 Keystatic 后再导入。', 500);
  }

  const refRes = await githubFetch(token, `/git/ref/heads/${encodeURIComponent(branch)}`);
  const ref = await refRes.json() as { object?: { sha?: string } };
  const baseCommitSha = ref.object?.sha;
  if (!baseCommitSha) throw new ImportError('无法读取 GitHub 分支引用。', 502);

  const commitRes = await githubFetch(token, `/git/commits/${baseCommitSha}`);
  const commit = await commitRes.json() as { tree?: { sha?: string } };
  const baseTreeSha = commit.tree?.sha;
  if (!baseTreeSha) throw new ImportError('无法读取 GitHub 基础 tree。', 502);

  const tree = [];
  for (const file of files) {
    const blobRes = await githubFetch(token, '/git/blobs', {
      method: 'POST',
      body: JSON.stringify({
        content: Buffer.from(file.data).toString('base64'),
        encoding: 'base64',
      }),
    });
    const blob = await blobRes.json() as { sha?: string };
    if (!blob.sha) throw new ImportError(`创建 GitHub blob 失败：${file.repoPath}`, 502);
    tree.push({
      path: file.repoPath,
      mode: '100644',
      type: 'blob',
      sha: blob.sha,
    });
  }

  const treeRes = await githubFetch(token, '/git/trees', {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree,
    }),
  });
  const newTree = await treeRes.json() as { sha?: string };
  if (!newTree.sha) throw new ImportError('创建 GitHub tree 失败。', 502);

  const newCommitRes = await githubFetch(token, '/git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message,
      tree: newTree.sha,
      parents: [baseCommitSha],
    }),
  });
  const newCommit = await newCommitRes.json() as { sha?: string };
  if (!newCommit.sha) throw new ImportError('创建 GitHub commit 失败。', 502);

  await githubFetch(token, `/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      sha: newCommit.sha,
      force: false,
    }),
  });
}

async function githubFetch(token: string, endpoint: string, init: RequestInit = {}) {
  const res = await fetch(githubUrl(endpoint), {
    ...init,
    headers: {
      ...githubHeaders(token),
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    throw new ImportError(`GitHub API 请求失败：${res.status} ${await res.text()}`, 502);
  }

  return res;
}

function githubUrl(endpoint: string) {
  return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}${endpoint}`;
}

function githubHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function createAssetIndex(assets: UploadedAsset[]) {
  const byPath = new Map<string, UploadedAsset>();
  const byName = new Map<string, UploadedAsset>();

  for (const asset of assets) {
    const normalized = normalizeAssetKey(asset.name);
    byPath.set(normalized, asset);
    byName.set(path.posix.basename(normalized), asset);
  }

  return { byPath, byName };
}

function findAsset(index: ReturnType<typeof createAssetIndex>, source: string): UploadedAsset | undefined {
  const normalized = normalizeAssetKey(source);
  return index.byPath.get(normalized) || index.byName.get(path.posix.basename(normalized));
}

function rewriteMarkdownImages(content: string, transform: (source: string) => string) {
  return content.replace(/!\[([^\]]*)\]\((<[^>]+>|[^)\s]+)(\s+["'][^)]*["'])?\)/g, (full, alt, rawUrl, titlePart = '') => {
    const wrapped = rawUrl.startsWith('<') && rawUrl.endsWith('>');
    const source = wrapped ? rawUrl.slice(1, -1) : rawUrl;
    const next = transform(source);
    const url = /[\s()]/.test(next) ? `<${next}>` : next;
    return `![${alt}](${url}${titlePart})`;
  });
}

function isRelativeAssetPath(value: string) {
  return !/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(value);
}

function isImagePath(value: string) {
  const ext = getExtension(value.split(/[?#]/)[0]);
  return Boolean(ext && IMAGE_EXTENSIONS.has(ext));
}

function uniqueAssetFilename(source: string, used: Set<string>) {
  const ext = getExtension(source) || 'png';
  const base = sanitizeFilename(path.posix.basename(source).replace(/\.[^.]+$/, '')) || 'image';
  let candidate = `${base}.${ext}`;
  let index = 2;

  while (used.has(candidate.toLowerCase())) {
    candidate = `${base}-${index}.${ext}`;
    index += 1;
  }

  used.add(candidate.toLowerCase());
  return candidate;
}

function normalizePathLike(value: string | undefined) {
  return value?.trim().replace(/\\/g, '/');
}

function normalizeAssetKey(value: string) {
  return decodeSafe(value)
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .toLowerCase();
}

function filenameWithoutExt(filename: string) {
  return path.basename(filename).replace(/\.[^.]+$/, '');
}

function slugifyPostTitle(value: string) {
  const slug = value
    .normalize('NFKC')
    .trim()
    .replace(/[\\/:*?"<>|#%{}\[\]^`]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  return slug || `post-${new Date().toISOString().slice(0, 10)}`;
}

function sanitizeFilename(value: string) {
  return value
    .normalize('NFKC')
    .trim()
    .replace(/[\\/:*?"<>|#%{}\[\]^`]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function normalizeDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string' && value.trim()) {
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
    if (match) return match[1];
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.valueOf())) return parsed.toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

function normalizeZone(value: unknown) {
  const zone = cleanSingleLine(asString(value));
  return zone && ZONES.has(zone) ? zone : DEFAULT_ZONE;
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(asString).map(cleanSingleLine).filter(Boolean);
  }

  const text = asString(value);
  if (!text) return [];

  return text
    .split(/[,，\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function deriveDescription(content: string) {
  const paragraph = content
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith('#') && !part.startsWith('!['));

  const plain = (paragraph || '从导入的 Markdown 草稿开始整理这篇文章。')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[[^\]]+\]\([^)]+\)/g, (match) => match.slice(1).split('](')[0])
    .replace(/[`*_>#-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return plain.slice(0, 160) || '从导入的 Markdown 草稿开始整理这篇文章。';
}

function cleanSingleLine(value: string | undefined) {
  return value?.replace(/\s+/g, ' ').trim();
}

function cleanMultiline(value: string | undefined) {
  return value?.replace(/\r\n/g, '\n').trim();
}

function asString(value: unknown) {
  if (value === null || value === undefined) return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function getExtension(value: string) {
  const match = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(value);
  return match?.[1].toLowerCase();
}

function decodeSafe(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function toRepoPath(...parts: string[]) {
  return parts.join('/').replace(/\\/g, '/').replace(/\/+/g, '/');
}

function assertWithinWorkspace(target: string) {
  const root = process.cwd();
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new ImportError('写入路径超出项目目录，已阻止导入。', 400);
  }
}
