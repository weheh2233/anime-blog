const KEYSTATIC_ACCESS_COOKIE = 'keystatic-gh-access-token';
const REPOSITORY_OWNER = 'weheh2233';
const REPOSITORY_NAME = 'anime-blog';

export async function hasKeystaticRepositoryAccess(request: Request): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production') return true;

  const token = readCookie(request.headers.get('cookie'), KEYSTATIC_ACCESS_COOKIE);
  if (!token) return false;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPOSITORY_OWNER}/${REPOSITORY_NAME}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    if (!response.ok) return false;

    const repository = (await response.json()) as {
      permissions?: {
        admin?: boolean;
        maintain?: boolean;
        push?: boolean;
      };
    };

    return Boolean(
      repository.permissions?.admin ||
      repository.permissions?.maintain ||
      repository.permissions?.push,
    );
  } catch {
    return false;
  }
}

function readCookie(header: string | null, name: string) {
  if (!header) return undefined;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;

    const key = part.slice(0, separator).trim();
    if (key !== name) continue;

    return decodeURIComponent(part.slice(separator + 1).trim());
  }

  return undefined;
}
