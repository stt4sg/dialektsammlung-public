import * as commonmark from 'commonmark';
import * as request from 'request-promise-native';

/* Github's network policy limits unauthenticated
 * requests (which these are) to the raw.githubusercontent.com
 * subdomain to 60 per hour.
 *
 * Going over this threshold will probably lead to blacklisting
 * of the instance's IP for a certain time period (throttling).
 */
const CACHE_AGE = 1000 * 60 * 60;
const cache: {
  [name: string]: { fetchedAt: number; textHTML: string };
} = {};

export default async function fetchDocument(name: string, pr: boolean): Promise<string> {
  if (!cache[name]) cache[name] = {} as any;

  let { fetchedAt, textHTML } = cache[name];

  if (textHTML && fetchedAt > Date.now() - CACHE_AGE) {
    return textHTML;
  }

  const [status, text] = await request({
    uri: `https://raw.githubusercontent.com/stt4sg/stt-docs/main/${pr ? 'pr' : 'legal'}/${name}.md`,
    resolveWithFullResponse: true,
  })
    .then((response: any) => [response.statusCode, response.body])
    .catch(response => [response.statusCode, null]);

  if (status < 300) {
    textHTML = new commonmark.HtmlRenderer().render(new commonmark.Parser().parse(text));
  }

  cache[name] = { fetchedAt: Date.now(), textHTML };

  return textHTML;
}
