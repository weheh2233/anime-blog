import type { APIRoute } from 'astro';
import {
  createKeystaticDraftPayload,
  isImportError,
  preparePostImport,
  type UploadedAsset,
} from '../../lib/postImport';
import { getKeystaticAccessToken, hasKeystaticRepositoryAccess } from '../../lib/keystaticAuth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const githubAccessToken = await assertImportAccess(request, form.get('secret'));

    const article = form.get('article');
    if (!(article instanceof File)) {
      return json({ ok: false, error: '请上传一篇 .md 或 .mdoc 文章。' }, 400);
    }

    const assets = await Promise.all(
      form
        .getAll('assets')
        .filter((asset): asset is File => asset instanceof File && asset.size > 0)
        .map(fileToAsset)
    );

    const prepared = await preparePostImport({
      articleName: article.name,
      articleText: await article.text(),
      assets,
      githubAccessToken,
      overrides: {
        title: getString(form.get('title')),
        description: getString(form.get('description')),
        author: getString(form.get('author')),
        publishDate: getString(form.get('publishDate')),
        zone: getString(form.get('zone')),
        tags: getString(form.get('tags')),
      },
    });

    const keystaticDraft = await createKeystaticDraftPayload(prepared, { githubAccessToken });

    return json({
      ok: true,
      slug: prepared.slug,
      filename: prepared.filename,
      frontmatter: prepared.frontmatter,
      writtenImagePaths: prepared.writtenImagePaths,
      createUrl: keystaticDraft.createUrl,
      keystaticDraft,
    });
  } catch (error) {
    const status = isImportError(error) ? error.status : (error as Error & { status?: number }).status || 500;
    const message = error instanceof Error ? error.message : '导入失败，请稍后重试。';
    return json({ ok: false, error: message }, status);
  }
};

async function fileToAsset(file: File): Promise<UploadedAsset> {
  return {
    name: file.name,
    data: new Uint8Array(await file.arrayBuffer()),
    type: file.type,
  };
}

async function assertImportAccess(request: Request, value: FormDataEntryValue | null) {
  if (process.env.NODE_ENV === 'production') {
    if (!(await hasKeystaticRepositoryAccess(request))) {
      const error = new Error('请先登录有仓库写入权限的 Keystatic 账号。');
      (error as Error & { status?: number }).status = 401;
      throw error;
    }
    return getKeystaticAccessToken(request);
  }

  assertSecret(value);
  return undefined;
}

function assertSecret(value: FormDataEntryValue | null) {
  const configured = process.env.BLOG_IMPORT_SECRET;
  const provided = getString(value);

  if (!configured && process.env.NODE_ENV === 'production') {
    const error = new Error('生产环境未配置 BLOG_IMPORT_SECRET，已阻止导入。');
    (error as Error & { status?: number }).status = 500;
    throw error;
  }

  if (configured && provided !== configured) {
    const error = new Error('导入密钥不正确。');
    (error as Error & { status?: number }).status = 401;
    throw error;
  }
}

function getString(value: FormDataEntryValue | null) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
